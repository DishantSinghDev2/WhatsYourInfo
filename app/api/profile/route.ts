// app/api/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { deleteAllUserAssets } from '@/lib/r2'; // <-- Import the new helper

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- 1. Delete all associated R2 assets FIRST ---
    // This is a "fire-and-forget" operation. We attempt to delete the assets,
    // but we proceed with deleting the DB record even if R2 deletion fails,
    // to ensure the user's primary data is removed. Errors are logged.
    await deleteAllUserAssets(user);
    
    // --- 2. Delete the user's database record ---
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const usersCollection = db.collection('users');

    const result = await usersCollection.deleteOne({ _id: new ObjectId(user._id) });

    if (result.deletedCount === 0) {
      // This case is unlikely if getUserFromToken succeeded, but it's good practice.
      return NextResponse.json({ error: 'User not found in database.' }, { status: 404 });
    }
    
    // The client will handle signing the user out and redirecting.
    return NextResponse.json({ message: 'Account permanently deleted.' });

  } catch (error) {
    console.error("Account deletion process error:", error);
    return NextResponse.json({ error: 'Failed to delete account due to an internal error.' }, { status: 500 });
  }
}