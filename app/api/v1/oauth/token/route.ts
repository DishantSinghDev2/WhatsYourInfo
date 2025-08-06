// app/api/v1/oauth/token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { SignJWT } from 'jose';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

// Schema for the initial code exchange
const codeGrantSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
  redirect_uri: z.string().url(),
  client_id: z.string(),
  client_secret: z.string(),
});

// Schema for the refresh token exchange
const refreshTokenGrantSchema = z.object({
  grant_type: z.literal('refresh_token'),
  refresh_token: z.string(),
  client_id: z.string(),
  client_secret: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const grantType = body.grant_type;

    if (grantType === 'authorization_code') {
      return handleAuthorizationCodeGrant(body);
    }

    if (grantType === 'refresh_token') {
      return handleRefreshTokenGrant(body);
    }

    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });

  } catch (error) {
    console.error('OAuth Token Exchange Error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// --- Handler for the initial code-for-token exchange ---
async function handleAuthorizationCodeGrant(body: unknown) {
  const validation = codeGrantSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { client_id, client_secret, code, redirect_uri } = validation.data;

  const db = (await clientPromise).db('whatsyourinfo');

  // 1. Authenticate the Client
  const oauthClient = await db.collection('oauth_clients').findOne({ clientId: client_id, clientSecret: client_secret });
  if (!oauthClient) return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  if (!oauthClient.redirectUris.includes(redirect_uri)) return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });

  // 2. Validate and consume the Authorization Code
  const authCode = await db.collection('oauth_codes').findOneAndDelete({ code });
  if (!authCode || authCode.expiresAt < new Date()) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Authorization code is invalid or expired.' }, { status: 400 });
  }
  if (authCode.clientId.toString() !== oauthClient._id.toString()) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
  }

  // 3. Generate Tokens
  const { accessToken, refreshToken } = await generateAndStoreTokens(db, authCode.userId, oauthClient._id, authCode.scope);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authCode.scope,
  });
}

// --- Handler for the refresh token exchange ---
async function handleRefreshTokenGrant(body: unknown) {
  const validation = refreshTokenGrantSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { client_id, client_secret, refresh_token } = validation.data;

  const db = (await clientPromise).db('whatsyourinfo');

  // 1. Authenticate the Client
  const oauthClient = await db.collection('oauth_clients').findOne({ clientId: client_id, clientSecret: client_secret });
  if (!oauthClient) return NextResponse.json({ error: 'invalid_client' }, { status: 401 });

  // 2. Validate and consume the Refresh Token
  const oldRefreshToken = await db.collection('oauth_refresh_tokens').findOne({ token: refresh_token });
  if (!oldRefreshToken || oldRefreshToken.revokedAt || oldRefreshToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Refresh token is invalid, expired, or revoked.' }, { status: 400 });
  }
  if (oldRefreshToken.clientId.toString() !== oauthClient._id.toString()) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
  }

  // --- REFRESH TOKEN ROTATION ---
  // 3. Revoke the old refresh token immediately
  await db.collection('oauth_refresh_tokens').updateOne({ _id: oldRefreshToken._id }, { $set: { revokedAt: new Date() } });

  // 4. Generate a new set of tokens
  const { accessToken, refreshToken } = await generateAndStoreTokens(db, oldRefreshToken.userId, oauthClient._id, oldRefreshToken.scope);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken, // The NEW refresh token
    scope: oldRefreshToken.scope,
  });
}

// --- Helper to generate and store tokens ---
async function generateAndStoreTokens(db: {
  collection: (name: string) => {
    insertOne: (data: unknown) => unknown
  }
}, userId: ObjectId, clientId: ObjectId, scope: string) {
  // 1. Generate Access Token (JWT)
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  const accessToken = await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId.toHexString())            // Convert ObjectId to string
    .setAudience(clientId.toHexString())         // Convert ObjectId to string
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  // 2. Generate and store Refresh Token
  const refreshToken = `wyi_refresh_${crypto.randomBytes(48).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90-day expiry
  await db.collection('oauth_refresh_tokens').insertOne({
    token: refreshToken,
    userId,
    clientId,
    scope,
    expiresAt,
    revokedAt: null,
  });

  return { accessToken, refreshToken };
}