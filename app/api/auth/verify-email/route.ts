// app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { Db, ObjectId } from 'mongodb';

// Helper function to contain the core verification logic
async function verifyToken(db: Db, token: string): Promise<boolean> {
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


// --- NEW: Handle link clicks from the email ---
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const redirectBaseUrl = new URL('/login', request.nextUrl.origin);

  if (!token) {
    redirectBaseUrl.searchParams.set('error', 'notoken');
    return NextResponse.redirect(redirectBaseUrl);
  }

  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const success = await verifyToken(db, token);

    if (success) {
      // On success, redirect to the login page with a success message
      redirectBaseUrl.searchParams.set('verified', 'true');
      return NextResponse.redirect(redirectBaseUrl);
    } else {
      // On failure, redirect to the verify page with an error
      const verifyPageUrl = new URL('/verify-email', request.nextUrl.origin);
      verifyPageUrl.searchParams.set('error', 'invalid_token');
      return NextResponse.redirect(verifyPageUrl);
    }
  } catch {
    const verifyPageUrl = new URL('/verify-email', request.nextUrl.origin);
    verifyPageUrl.searchParams.set('error', 'server_error');
    return NextResponse.redirect(verifyPageUrl);
  }
}

// --- Your existing POST route for manual form submission ---
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const { token } = verifyEmailSchema.parse(await request.json());
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const success = await verifyToken(db, token);

    if (success) {
      return NextResponse.json({ message: 'Email verified successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

  } catch  {
    const verifyPageUrl = new URL('/verify-email', request.nextUrl.origin);
    verifyPageUrl.searchParams.set('error', 'server_error');
    return NextResponse.redirect(verifyPageUrl);
  }
}