// app/oauth/authorize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import { ObjectId, WithId, Document } from 'mongodb';

// --- The GET handler that starts the OAuth flow ---
export async function GET(request: NextRequest) {
  try {
    // 1. Check if the user is logged in.
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);

    // If the user is not logged in, redirect them to the login page.
    // Pass the original authorization request as the callbackUrl.
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      // The callback should be the authorize URL itself, so they come back here after login
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Extract and validate OAuth parameters from the query string.
    const clientId = searchParams.get('client_id');
    const redirectUri = searchParams.get('redirect_uri');
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');
    const responseType = searchParams.get('response_type');

    if (responseType !== 'code') {
      return NextResponse.json({ error: 'Unsupported response_type. Must be "code".' }, { status: 400 });
    }

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'client_id and redirect_uri are required.' }, { status: 400 });
    }

    // 3. Validate the client_id and redirect_uri against the database.
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const oauthClient = await db.collection('oauth_clients').findOne({ clientId: clientId });

    // IMPORTANT: The redirect_uri from the request MUST EXACTLY match one of the registered URIs.
    if (!oauthClient || !oauthClient.redirectUris.includes(redirectUri)) {
      return NextResponse.json({ error: "Invalid client_id or redirect_uri." }, { status: 400 });
    }

    console.log('oauthClient 0', oauthClient)

    // 4. Check if consent can be skipped.
    const existingAuthorization = await db.collection('oauth_authorizations').findOne({
      userId: user._id,
      clientId: oauthClient._id,
    });

    const requestedScopes = scope
      ? scope.split(' ').filter(s => /^[a-zA-Z0-9:_-]{1,64}$/.test(s)).slice(0, 10)
      : [];

    // --- Safe check ---
    const existingScopes = existingAuthorization && Array.isArray(existingAuthorization.grantedScopes)
      ? existingAuthorization.grantedScopes
      : [];

    const hasConsent = existingAuthorization && requestedScopes.every(s => existingScopes.includes(s));

    // --- MODIFICATION START ---
    // Automatically skip consent if the app is internal and operated by us.
    const isTrustedInternalApp = oauthClient.isInternal && oauthClient.opByWYI;

    if (hasConsent || isTrustedInternalApp) {
      return generateCodeAndRedirect(new ObjectId(user._id), oauthClient, redirectUri, state, requestedScopes);
    }
    // --- MODIFICATION END ---


    // 5. If no prior consent and not a trusted app, redirect to the consent page.
    // Pass all the necessary info for the consent page to render.
    const consentUrl = new URL('/oauth/consent', request.url);
    consentUrl.search = searchParams.toString(); // Forward all original params
    return NextResponse.redirect(consentUrl);

  } catch (error) {
    console.error("OAuth Authorize GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// --- Helper function to avoid duplicating code ---
async function generateCodeAndRedirect(userId: ObjectId, oauthClient: WithId<Document>, redirectUri: string, state: string | null, scopes: string[]) {
  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  // 1. Generate Authorization Code
  const authCode = crypto.randomBytes(32).toString('hex');
  const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // 2. Store the code
  const doc = {
    code: authCode,
    userId: userId,
    clientId: new ObjectId(oauthClient._id),
    scope: scopes,
    expiresAt: codeExpires,
  };


  const size = Buffer.byteLength(JSON.stringify(doc));
  if (size > 16 * 1024 * 1024) {
    console.error(`❌ Document too large: ${size} bytes`, doc);
    return NextResponse.json({ error: 'Data received is too large' }, { status: 500 });
  }

  await db.collection('oauth_codes').insertOne(doc);

  console.log('1')


  // 3. Store the user's consent
  const existingAuth = await db.collection('oauth_authorizations').findOne({ userId: userId, clientId: doc.clientId });
  const existingScopes = Array.isArray(existingAuth?.grantedScopes)
    ? existingAuth.grantedScopes
    : [];
  const combinedScopes = Array.from(new Set([...existingScopes, ...scopes])); // Merge and remove duplicates

  console.log(combinedScopes)

  await db.collection('oauth_authorizations').updateOne(
    { userId: userId, clientId: doc.clientId },
    {
      $set: { grantedScopes: combinedScopes, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );

  console.log('2')


  // 4. Redirect back to the third-party app with the code
  const finalRedirectUrl = new URL(redirectUri);
  finalRedirectUrl.searchParams.set('code', authCode);
  if (state) finalRedirectUrl.searchParams.set('state', state);

  // From the POST handler, we return JSON. From GET, we redirect directly.
  if (typeof window === 'undefined') { // We are on the server (GET request)
    return NextResponse.redirect(finalRedirectUrl.toString());
  } else { // We are in the POST handler (called from client-side)
    return NextResponse.json({ redirect: finalRedirectUrl.toString() });
  }
}