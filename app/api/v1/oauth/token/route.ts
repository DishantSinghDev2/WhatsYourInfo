// app/api/oauth/token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { SignJWT } from 'jose';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// Schemas remain unchanged
const codeGrantSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
  redirect_uri: z.string().url(),
  client_id: z.string(),
  client_secret: z.string(),
});

const refreshTokenGrantSchema = z.object({
  grant_type: z.literal('refresh_token'),
  refresh_token: z.string(),
  client_id: z.string(),
  client_secret: z.string(),
});

// The main POST function is already excellent and needs no changes.
export async function POST(request: NextRequest) {
  // ... (Your main POST handler is unchanged)
  try {
    const contentType = request.headers.get('content-type');
    let body: any;

    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      return NextResponse.json({ error: 'unsupported_content_type' }, { status: 415 });
    }

    const grantType = body.grant_type;

    if (grantType === 'authorization_code') {
      return handleAuthorizationCodeGrant(body);
    }

    if (grantType === 'refresh_token') {
      return handleRefreshTokenGrant(body);
    }

    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });

  } catch (error) {
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'invalid_request', error_description: 'Malformed request body.' }, { status: 400 });
    }
    console.error('OAuth Token Exchange Error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// --- Handler for 'authorization_code' grant type ---
async function handleAuthorizationCodeGrant(body: unknown) {
  const validation = codeGrantSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Missing or invalid parameters.' }, { status: 400 });
  }

  // --- (2) SANITIZE ALL INPUTS AFTER VALIDATION ---
  const { client_id, client_secret, code, redirect_uri } = validation.data;
  const sanitizedClientId = DOMPurify.sanitize(client_id);
  const sanitizedClientSecret = DOMPurify.sanitize(client_secret);
  const sanitizedCode = DOMPurify.sanitize(code);
  const sanitizedRedirectUri = DOMPurify.sanitize(redirect_uri);

  const db = (await clientPromise).db('whatsyourinfo');

  // --- (3) USE SANITIZED DATA FOR ALL DB QUERIES ---
  const oauthClient = await db.collection('oauth_clients').findOne({ clientId: sanitizedClientId, clientSecret: sanitizedClientSecret });
  if (!oauthClient) return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  if (!oauthClient.redirectUris.includes(sanitizedRedirectUri)) return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });

  const authCode = await db.collection('oauth_codes').findOneAndDelete({ code: sanitizedCode });
  if (!authCode || authCode.expiresAt < new Date() || authCode.clientId.toString() !== oauthClient._id.toString()) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Authorization code is invalid, expired, or was used.' }, { status: 400 });
  }

  const { accessToken, refreshToken } = await generateAndStoreTokens(db, authCode.userId, oauthClient._id, authCode.scope);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authCode.scope,
  });
}

// --- Handler for 'refresh_token' grant type ---
async function handleRefreshTokenGrant(body: unknown) {
  const validation = refreshTokenGrantSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Missing or invalid parameters.' }, { status: 400 });
  }

  // --- (2) SANITIZE ALL INPUTS AFTER VALIDATION ---
  const { client_id, client_secret, refresh_token } = validation.data;
  const sanitizedClientId = DOMPurify.sanitize(client_id);
  const sanitizedClientSecret = DOMPurify.sanitize(client_secret);
  const sanitizedRefreshToken = DOMPurify.sanitize(refresh_token);

  const db = (await clientPromise).db('whatsyourinfo');

  // --- (3) USE SANITIZED DATA FOR ALL DB QUERIES ---
  const oauthClient = await db.collection('oauth_clients').findOne({ clientId: sanitizedClientId, clientSecret: sanitizedClientSecret });
  if (!oauthClient) return NextResponse.json({ error: 'invalid_client' }, { status: 401 });

  const oldRefreshToken = await db.collection('oauth_refresh_tokens').findOne({ token: sanitizedRefreshToken });
  if (!oldRefreshToken || oldRefreshToken.revokedAt || oldRefreshToken.expiresAt < new Date() || oldRefreshToken.clientId.toString() !== oauthClient._id.toString()) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Refresh token is invalid, expired, or revoked.' }, { status: 400 });
  }
  
  await db.collection('oauth_refresh_tokens').updateOne({ _id: oldRefreshToken._id }, { $set: { revokedAt: new Date() } });

  const { accessToken, refreshToken } = await generateAndStoreTokens(db, oldRefreshToken.userId, oauthClient._id, oldRefreshToken.scope);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: oldRefreshToken.scope,
  });
}

// Helper function remains unchanged.
async function generateAndStoreTokens(db: any, userId: ObjectId, clientId: ObjectId, scope: string) {
  // ... (your excellent generateAndStoreTokens function is unchanged)
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const accessToken = await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId.toHexString())
    .setAudience(clientId.toHexString())
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
  const refreshToken = `wyi_refresh_${crypto.randomBytes(48).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  await db.collection('oauth_refresh_tokens').insertOne({
    token: refreshToken, userId, clientId, scope, expiresAt, revokedAt: null,
  });
  return { accessToken, refreshToken };
}