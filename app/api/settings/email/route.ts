// app/api/settings/email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
// Assume you have a mail sending utility
import { sendVerificationEmail } from '@/lib/email';

const emailChangeSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = emailChangeSchema.parse(await request.json());

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Check if the new email is already in use
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
    }

    // Update the user's email and reset verification status
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { email: email, emailVerified: false, updatedAt: new Date() } }
    );
    
    // Send a new verification email to the new address
    await sendVerificationEmail(email, user.firstName);

    return NextResponse.json({ message: 'Email updated. Please check your new inbox to verify it.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Email change error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}