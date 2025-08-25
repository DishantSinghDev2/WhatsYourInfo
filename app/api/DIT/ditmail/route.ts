import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"

const INTERNAL_SECRET = process.env.INTERNAL_JWT_SECRET as string
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",")

/**
 * Utility: Check request origin for domain restriction
 */
function isAllowedOrigin(req: NextRequest) {
  const origin = req.headers.get("origin")
  if (!origin) return false
  return ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))
}

/**
 * Utility: Verify internal platform JWT
 */
function verifyInternalJWT(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.split(" ")[1]
  try {
    return jwt.verify(token, INTERNAL_SECRET) as {
      email: string
      newEmail?: string
      [key: string]: any
    }
  } catch (err) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ Step 1: Enforce domain restriction
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: "Forbidden - Invalid origin" }, { status: 403 })
    }

    // ✅ Step 2: Verify internal JWT (for internal platforms only)
    const internalClaims = verifyInternalJWT(request)
    if (!internalClaims) {
      return NextResponse.json({ error: "Forbidden - Invalid internal token" }, { status: 403 })
    }

    if (!internalClaims?.email || !internalClaims?.newEmail) {
      return NextResponse.json({ error: "Unauthorized - Missing claims" }, { status: 401 })
    }

    // ✅ Step 3: Connect to DB
    const client = await clientPromise
    const db = client.db("whatsyourinfo")

    // ✅ Step 4: Update user
    const res = await db.collection("users").findOneAndUpdate(
      { email: internalClaims.email },
      {
        $set: {
          email: internalClaims.newEmail,
          recoveryEmail: internalClaims.email,
        },
      },
      { returnDocument: "after" }
    )

    if (!res?.value) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "User email updated successfully",
      updatedUser: res.value,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
