import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Hash the token received from the client to match the one in the DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Find the user by the hashed token AND ensure it has not expired
    const user = await db.collection('users').findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() } // Check if the expiry date is in the future
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired password reset token.' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and, crucially, remove the reset token fields
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { passwordResetToken: "", passwordResetExpires: "" }
      }
    );

    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}