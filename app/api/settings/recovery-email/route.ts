// app/api/settings/recovery-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendRecoveryEmailVerification } from '@/lib/email';

const changeSchema = z.object({
  currentPassword: z.string().min(1, 'Your current password is required.'),
  newEmail: z.string().email('Please enter a valid email address.'),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newEmail } = changeSchema.parse(await request.json());

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // 1. Verify the user's current password for security
    const fullUser = await db.collection('users').findOne({ _id: new ObjectId(user._id) });
    if (!fullUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const isPasswordCorrect = await bcrypt.compare(currentPassword, fullUser.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'The password you entered is incorrect.' }, { status: 403 });
    }

    // 2. Generate token and set temporary fields in the database
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: {
          pendingRecoveryEmail: newEmail,
          recoveryEmailToken: token,
          recoveryEmailExpires: expires
      }}
    );
    
    // 3. Send the verification email
    await sendRecoveryEmailVerification({ to: newEmail, name: user.firstName, token });

    return NextResponse.json({ message: `A confirmation link has been sent to ${newEmail}. Please check your inbox.` });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Recovery email change error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}