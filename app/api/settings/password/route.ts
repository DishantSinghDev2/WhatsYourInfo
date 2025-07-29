// app/api/settings/password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long.'),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = passwordChangeSchema.parse(await request.json());

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    
    // Fetch the user's full document to get the hashed password
    const fullUser = await db.collection('users').findOne({ _id: new ObjectId(user._id) });
    if (!fullUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Verify the current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, fullUser.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'The current password you entered is incorrect.' }, { status: 403 });
    }

    // Hash the new password and update it
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { password: hashedNewPassword, updatedAt: new Date() } }
    );

    return NextResponse.json({ message: 'Password updated successfully.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Password change error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}