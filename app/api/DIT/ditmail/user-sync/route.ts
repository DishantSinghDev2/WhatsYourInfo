import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { z } from "zod"
import DOMPurify from "isomorphic-dompurify"
import clientPromise from "@/lib/mongodb"
import { createUser } from "@/lib/auth"

// --- Environment Variables ---
const INTERNAL_SECRET = process.env.INTERNAL_JWT_SECRET as string
if (!INTERNAL_SECRET) {
  throw new Error("INTERNAL_JWT_SECRET is not defined in environment variables")
}

// --- Zod Schemas for Action-Specific Payloads ---
const createPayloadSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  username: z.string().trim().min(3).regex(/^[a-zA-Z0-9_.-]+$/),
});

const updatePayloadSchema = z.object({
  currentEmail: z.string().email(),
  updates: z.object({
    email: z.string().email().optional(),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    username: z.string().trim().min(3).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
  })
});

const deletePayloadSchema = z.object({
  email: z.string().email(),
});

// --- Main Schema for the Request Body ---
const manageUserSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  payload: z.any(),
});

/**
 * API Route to create, update, or delete a user in WhatsYour.Info from an internal service.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the Internal JWT
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Forbidden: Missing authorization token" }, { status: 403 })
    }
    const token = authHeader.split(" ")[1]
    let decoded: any
    try {
      decoded = jwt.verify(token, INTERNAL_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Forbidden: Invalid or expired token" }, { status: 403 })
    }

    // 2. Validate the overall structure (action and payload)
    const body = manageUserSchema.parse(decoded);
    const { action, payload } = body;

    const client = await clientPromise
    const db = client.db("whatsyourinfo")
    const usersCollection = db.collection("users")

    // 3. Process the request based on the action
    switch (action) {
      case "create": {
        const createData = createPayloadSchema.parse(payload);
        // Sanitize all inputs
        const sanitized = {
            email: DOMPurify.sanitize(createData.email),
            username: DOMPurify.sanitize(createData.username),
            firstName: DOMPurify.sanitize(createData.firstName),
            lastName: DOMPurify.sanitize(createData.lastName),
        }

        const existingUser = await usersCollection.findOne({ $or: [{ email: sanitized.email }, { username: sanitized.username }] });
        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 409 }); // Use 409 Conflict
        }

        await createUser({
            type: "personal",
            profileVisibility: "private",
            ...sanitized,
            password: createData.password, // Let createUser handle hashing
            emailVerified: true,
            emailVerifiedAt: new Date(),
        });
        return NextResponse.json({ success: true, message: "User created successfully" }, { status: 201 });
      }

      case "update": {
        const { currentEmail, updates } = updatePayloadSchema.parse(payload);
        
        // Sanitize the updates object
        const sanitizedUpdates: { [key: string]: string } = {};
        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === 'string') {
                sanitizedUpdates[key] = DOMPurify.sanitize(value);
            }
        }
        
        const result = await usersCollection.updateOne(
            { email: currentEmail },
            { $set: sanitizedUpdates }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "User to update not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "User updated successfully" });
      }

      case "delete": {
        const { email } = deletePayloadSchema.parse(payload);
        const result = await usersCollection.deleteOne({ email });

        if (result.deletedCount === 0) {
            // Not an error; the user might have already been deleted.
            return NextResponse.json({ success: true, message: "User not found or already deleted" });
        }
        return NextResponse.json({ success: true, message: "User deleted successfully" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("User management sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}