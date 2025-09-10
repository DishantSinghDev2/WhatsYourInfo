import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { z } from "zod"
import DOMPurify from "isomorphic-dompurify"
import clientPromise from "@/lib/mongodb"
import { createUser } from "@/lib/auth" // Reusing your existing user creation logic

// --- Environment Variables ---
const INTERNAL_SECRET = process.env.INTERNAL_JWT_SECRET as string
if (!INTERNAL_SECRET) {
  throw new Error("INTERNAL_JWT_SECRET is not defined in environment variables")
}

// --- Zod Schema for Validation (consistent with your public registration) ---
const userSyncSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8), // Password will be sent from DITMail
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  // The username can be derived from the email if not provided
  username: z.string().trim().min(3).regex(/^[a-zA-Z0-9_.-]+$/),
})

// --- Type for the JWT payload ---
type UserSyncPayload = z.infer<typeof userSyncSchema>

/**
 * API Route to create a user in WhatsYour.Info from an internal service call (e.g., DITMail)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the Internal JWT from the Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Forbidden: Missing authorization token" }, { status: 403 })
    }

    const token = authHeader.split(" ")[1]
    let payload: UserSyncPayload

    try {
      // Decode the token and validate its structure
      const decoded = jwt.verify(token, INTERNAL_SECRET)
      payload = userSyncSchema.parse(decoded)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: "Validation error in token payload", details: err.errors }, { status: 400 })
      }
      return NextResponse.json({ error: "Forbidden: Invalid or expired token" }, { status: 403 })
    }

    // 2. Sanitize all string inputs from the payload
    const { email, password, username, firstName, lastName } = payload
    const sanitizedEmail = DOMPurify.sanitize(email)
    const sanitizedUsername = DOMPurify.sanitize(username)
    const sanitizedFirstName = DOMPurify.sanitize(firstName)
    const sanitizedLastName = DOMPurify.sanitize(lastName)

    // 3. Connect to the database and check for existing users
    const client = await clientPromise
    const db = client.db("whatsyourinfo")

    const existingUser = await db.collection("users").findOne({
      $or: [{ email: sanitizedEmail }, { username: sanitizedUsername }],
    })

    if (existingUser) {
      // If user already exists, it's not an error. It means they are already synced.
      // We return a success response to prevent the calling service from retrying.
      return NextResponse.json({ message: "User already exists and is in sync" }, { status: 200 })
    }

    // 4. Create the new user using the sanitized data and existing business logic
    await createUser({
      type: "personal",
      profileVisibility: "private", // Default visibility for synced users
      email: sanitizedEmail,
      password, // The createUser function will handle hashing
      username: sanitizedUsername,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      // Assume email is pre-verified as it comes from a trusted source
      emailVerified: true, 
      emailVerifiedAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "User synced successfully" }, { status: 201 })

  } catch (error) {
    console.error("User sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}