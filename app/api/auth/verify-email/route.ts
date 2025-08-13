// app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { Db, ObjectId } from 'mongodb';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// Helper function to contain the core verification logic (no changes needed here)
async function verifyToken(db: Db, token: string): Promise<boolean> {
  // This function now receives a pre-sanitized token
  const user = await db.collection('users').findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    return false; // Token is invalid or expired
  }

  // Update user as verified and clean up token fields
  await db.collection('users').updateOne(
    { _id: new ObjectId(user._id) },
    {
      $set: { emailVerified: true, updatedAt: new Date() },
      $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 }
    }
  );

  return true;
}


// --- Handle link clicks from the email ---
export async function GET(request: NextRequest) {
  const unsafeToken = request.nextUrl.searchParams.get('token');
  const redirectBaseUrl = new URL('/login', request.nextUrl.origin);

  if (!unsafeToken) {
    redirectBaseUrl.searchParams.set('error', 'notoken');
    return NextResponse.redirect(redirectBaseUrl);
  }

  try {
    // --- (2) SANITIZE THE TOKEN FROM THE URL ---
    const sanitizedToken = DOMPurify.sanitize(unsafeToken);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    // Pass the sanitized token to the verification logic
    const success = await verifyToken(db, sanitizedToken);

    if (success) {
      redirectBaseUrl.searchParams.set('verified', 'true');
      return NextResponse.redirect(redirectBaseUrl);
    } else {
      const verifyPageUrl = new URL('/verify-email', request.nextUrl.origin);
      verifyPageUrl.searchParams.set('error', 'invalid_token');
      return NextResponse.redirect(verifyPageUrl);
    }
  } catch (error) {
    console.error("Email verification GET error:", error);
    const verifyPageUrl = new URL('/verify-email', request.nextUrl.origin);
    verifyPageUrl.searchParams.set('error', 'server_error');
    return NextResponse.redirect(verifyPageUrl);
  }
}

// --- Your existing POST route for manual form submission ---
// Add .trim() for good measure
const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const { token: unsafeToken } = verifyEmailSchema.parse(await request.json());

    // --- (3) SANITIZE THE TOKEN FROM THE POST BODY ---
    const sanitizedToken = DOMPurify.sanitize(unsafeToken);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    // Pass the sanitized token to the verification logic
    const success = await verifyToken(db, sanitizedToken);

    if (success) {
      return NextResponse.json({ message: 'Email verified successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

  } catch (error) {
    console.error("Email verification POST error:", error);
    // For API routes, it's better to return a JSON error than to redirect
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}