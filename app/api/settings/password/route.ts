// app/api/settings/password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// The Zod schema correctly validates the shape and rules of the input.
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long.'),
});

export async function PUT(request: NextRequest) {
  try {
    // 1. Authentication: Ensure user is logged in. This is the first gate.
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validation: Ensure the request body is correctly formatted.
    const { currentPassword, newPassword } = passwordChangeSchema.parse(await request.json());

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    
    // Fetch the user's full document to get the securely stored hashed password.
    const fullUser = await db.collection('users').findOne({ _id: new ObjectId(user._id) });
    if (!fullUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // 3. Authorization: Verify the current password.
    // This is the most critical step to ensure the user is authorized to make this change.
    // bcrypt.compare is the secure way to do this without ever decrypting the password.
    const isPasswordCorrect = await bcrypt.compare(currentPassword, fullUser.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'The current password you entered is incorrect.' }, { status: 403 });
    }

    // 4. Secure Storage: Hash the new password before storing it.
    // This ensures that even if the database is compromised, the actual passwords are not exposed.
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { password: hashedNewPassword, updatedAt: new Date() } }
    );

    return NextResponse.json({ message: 'Password updated successfully.' });

  } catch (error) {
    // 5. Robust Error Handling: Catch validation and other errors gracefully.
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Password change error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}