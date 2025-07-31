// app/api/cron/purge-deleted-users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { deleteAllUserAssets } from '@/lib/r2'; // The R2 deletion helper we made before
import { UserProfile } from '@/types';

const DELETION_GRACE_PERIOD_DAYS = 30;

export async function GET(request: NextRequest) {
  // CRITICAL: This is the security check.
  const authToken = (request.headers.get('authorization') || '').split('Bearer ')[1];
  
  // The CRON_SECRET must be set in your Vercel Environment Variables.
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DELETION_GRACE_PERIOD_DAYS);

    // Find all users whose deactivation date is past the grace period
    const usersToDelete = await db.collection('users').find(
      { deactivatedAt: { $lte: cutoffDate } }
    ).toArray();

    if (usersToDelete.length === 0) {
      return NextResponse.json({ message: 'No accounts to purge.' });
    }

    const userIdsToDelete = usersToDelete.map(u => new ObjectId(u._id));

    // --- Perform Deletions ---
    for (const user of usersToDelete) {
        // 1. Delete associated R2 assets (avatars, headers, etc.)
        await deleteAllUserAssets(user as UserProfile);

        // 2. Delete associated data (API keys, leads, connections, etc.)
        await db.collection('api_keys').deleteMany({ userId: new ObjectId(user._id) });
        await db.collection('leads').deleteMany({ forUser: new ObjectId(user._id) });
        await db.collection('oauth_authorizations').deleteMany({ userId: new ObjectId(user._id) });
        // ... add any other related collections here
    }

    // 3. Delete the users themselves
    await db.collection('users').deleteMany({ _id: { $in: userIdsToDelete } });

    return NextResponse.json({
      message: `Successfully purged ${usersToDelete.length} account(s).`,
      purgedUsernames: usersToDelete.map(u => u.username)
    });

  } catch (error) {
    console.error("Cron purge error:", error);
    return NextResponse.json({ error: 'Internal Server Error during purge.' }, { status: 500 });
  }
}