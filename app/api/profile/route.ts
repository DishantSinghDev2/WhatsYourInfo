// app/api/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendAccountDeletionEmail } from '@/lib/email'; // We will create this
import { cacheDel } from '@/lib/cache';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- SOFT DELETE: Mark the user for deletion instead of deleting immediately ---
    const deletionDate = new Date();
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { deactivatedAt: deletionDate, updatedAt: deletionDate } }
    );
    
    // Send a notification email to the user
    // We don't await this, as the core action is complete
    await sendAccountDeletionEmail(user.email, user.firstName);

    await cacheDel(`user:profile:${user.username}`);

    // Invalidate the user's session by clearing the auth cookie
    const response = NextResponse.json({ message: 'Account scheduled for permanent deletion.' });
    response.cookies.set('auth-token', '', { maxAge: -1, path: '/' });
    
    return response;

  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: 'Failed to schedule account deletion.' }, { status: 500 });
  }
}