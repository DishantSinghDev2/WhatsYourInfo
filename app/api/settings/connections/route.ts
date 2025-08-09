// app/api/settings/connections/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { dispatchWebhookEvent } from '@/lib/webhooks';

// GET: Fetches all apps a user has authorized
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  const authorizations = await db.collection('oauth_authorizations').aggregate([
    { $match: { userId: new ObjectId(user._id) } },
    {
      $lookup: {
        from: 'oauth_clients',
        localField: 'clientId',
        foreignField: '_id',
        as: 'clientDetails'
      }
    },
    { $unwind: '$clientDetails' },
    {
      $project: {
        clientId: '$clientDetails.clientId',
        name: '$clientDetails.name',
        appLogo: '$clientDetails.appLogo',
        homepageUrl: '$clientDetails.homepageUrl',
        grantedScopes: 1,
        createdAt: 1,
      }
    }
  ]).toArray();

  return NextResponse.json(authorizations);
}

// DELETE: Revokes an app's access and all its refresh tokens
export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await request.json();
  if (!clientId) return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  const oauthClient = await db.collection('oauth_clients').findOne({ clientId });
  if (!oauthClient) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const userId = new ObjectId(user._id);
  const internalClientId = oauthClient._id;

  // Perform both revocations concurrently
  const result = await Promise.all([
    // 1. Delete the authorization record
    db.collection('oauth_authorizations').deleteOne({ userId, clientId: internalClientId }),

    // 2. --- NEW: Revoke all refresh tokens for this user/client combo ---
    db.collection('oauth_refresh_tokens').updateMany(
      { userId, clientId: internalClientId },
      { $set: { revokedAt: new Date() } }
    )
  ]);

  if (result[1].upsertedCount > 0) {
    // Dispatch a webhook event when user revokes certain apps
    await dispatchWebhookEvent('user.revoked', new ObjectId(user._id), {
      clientId: oauthClient._id.toString(),
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json({ message: 'Application access has been revoked.' });
}
