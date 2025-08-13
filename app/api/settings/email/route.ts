// app/api/settings/email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { sendVerificationEmail } from '@/lib/email';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// --- (2) STRENGTHEN THE ZOD SCHEMA ---
const emailChangeSchema = z.object({
  // .trim() removes leading/trailing whitespace.
  // .toLowerCase() ensures consistent storage format.
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email: validatedEmail } = emailChangeSchema.parse(await request.json());

    // --- (3) SANITIZE THE VALIDATED EMAIL ---
    // This provides defense-in-depth, stripping any potential HTML.
    const sanitizedEmail = DOMPurify.sanitize(validatedEmail);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (4) USE THE SANITIZED EMAIL FOR ALL DB OPERATIONS ---
    // Check if the new email is already in use
    const existingUser = await db.collection('users').findOne({ email: sanitizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
    }

    // Update the user's email and reset verification status
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { email: sanitizedEmail, emailVerified: false, updatedAt: new Date() } }
    );
    
    // Send a new verification email to the new, sanitized address
    await sendVerificationEmail(sanitizedEmail, user.firstName);

    return NextResponse.json({ message: 'Email updated. Please check your new inbox to verify it.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Email change error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}