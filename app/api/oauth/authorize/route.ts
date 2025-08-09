// app/api/oauth/authorize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import { dispatchWebhookEvent } from '@/lib/webhooks';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'User session not found.' }, { status: 401 });
    }

    const { client_id, redirect_uri, scope, state, allow } = await request.json();

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const oauthClient = await db.collection('oauth_clients').findOne({ clientId: client_id });

    // Re-validate everything
    if (!oauthClient || !oauthClient.redirectUris.includes(redirect_uri)) {
      return NextResponse.json({ error: 'Invalid client or redirect URI.' }, { status: 400 });
    }

    const finalRedirectUrl = new URL(redirect_uri);

    if (!allow) {
      finalRedirectUrl.searchParams.set('error', 'access_denied');
      if (state) finalRedirectUrl.searchParams.set('state', state);
      return NextResponse.json({ redirect: finalRedirectUrl.toString() });
    }

    // --- User has allowed access ---

    // 1. Generate Authorization Code
    const authCode = crypto.randomBytes(32).toString('hex');
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // Code is valid for 10 minutes

    // 2. Store the code with user and client info
    await db.collection('oauth_codes').insertOne({
      code: authCode,
      userId: new ObjectId(user._id),
      clientId: oauthClient._id,
      scope: scope,
      expiresAt: codeExpires,
    });

    // 3. Store the user's consent so they don't have to be asked again
    const result = await db.collection('oauth_authorizations').updateOne(
      { userId: new ObjectId(user._id), clientId: oauthClient._id },
      { $set: { grantedScopes: scope.split(' '), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    if (result.upsertedCount > 0) { // This means it was a new authorization
      // Dispatch a webhook event for a new user connection
      await dispatchWebhookEvent('user.connected', new ObjectId(user._id), {
        clientId: oauthClient._id.toString(),
        grantedScopes: scope.split(' '),
        timestamp: new Date().toISOString()
      });
    }

    // 4. Redirect back to the third-party app
    finalRedirectUrl.searchParams.set('code', authCode);
    if (state) finalRedirectUrl.searchParams.set('state', state);

    return NextResponse.json({ redirect: finalRedirectUrl.toString() });

  } catch (error) {
    console.error("OAuth Consent POST Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}