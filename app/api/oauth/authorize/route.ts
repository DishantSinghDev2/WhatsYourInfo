// app/api/oauth/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import { dispatchWebhookEvent } from '@/lib/webhooks';
import { ObjectId } from 'mongodb';
import { z } from 'zod'; // --- (1) IMPORT ZOD & SANITIZER
import DOMPurify from 'isomorphic-dompurify';

// --- (2) DEFINE A STRICT SCHEMA FOR THE REQUEST BODY ---
const consentSchema = z.object({
  client_id: z.string().trim().min(1, 'client_id is required'),
  redirect_uri: z.string().trim().url('Invalid redirect_uri format'),
  scope: z.string().trim(), // A string of space-separated scopes
  state: z.string().optional(),
  allow: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'User session not found.' }, { status: 401 });
    }

    const body = await request.json();
    // --- (3) VALIDATE INCOMING DATA ---
    const validatedData = consentSchema.parse(body);

    // --- (4) SANITIZE ALL VALIDATED INPUTS ---
    const sanitizedClientId = DOMPurify.sanitize(validatedData.client_id);
    const sanitizedRedirectUri = DOMPurify.sanitize(validatedData.redirect_uri);
    const sanitizedScope = DOMPurify.sanitize(validatedData.scope);
    const sanitizedState = validatedData.state ? DOMPurify.sanitize(validatedData.state) : undefined;
    const { allow } = validatedData; // Boolean is already safe

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (5) USE SANITIZED DATA FOR ALL OPERATIONS ---
    const oauthClient = await db.collection('oauth_clients').findOne({ clientId: sanitizedClientId });

    // This validation is excellent. Keep it.
    if (!oauthClient || !oauthClient.redirectUris.includes(sanitizedRedirectUri)) {
      return NextResponse.json({ error: 'Invalid client or redirect URI.' }, { status: 400 });
    }

    const finalRedirectUrl = new URL(sanitizedRedirectUri);

    if (!allow) {
      finalRedirectUrl.searchParams.set('error', 'access_denied');
      if (sanitizedState) finalRedirectUrl.searchParams.set('state', sanitizedState);
      return NextResponse.json({ redirect: finalRedirectUrl.toString() });
    }

    // --- User has allowed access ---

    // 1. Generate Authorization Code
    const authCode = crypto.randomBytes(32).toString('hex');
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 2. Store the code with sanitized scope
    await db.collection('oauth_codes').insertOne({
      code: authCode,
      userId: new ObjectId(user._id),
      clientId: oauthClient._id,
      scope: sanitizedScope, // Store clean scope
      expiresAt: codeExpires,
    });

    // 3. Store the user's consent with sanitized scope
    const result = await db.collection('oauth_authorizations').updateOne(
      { userId: new ObjectId(user._id), clientId: oauthClient._id },
      { $set: { grantedScopes: sanitizedScope.split(' '), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      await dispatchWebhookEvent('user.connected', new ObjectId(user._id), {
        clientId: oauthClient._id.toString(),
        grantedScopes: sanitizedScope.split(' '), // Use clean scope
        timestamp: new Date().toISOString()
      });
    }

    // 4. Redirect back with sanitized state
    finalRedirectUrl.searchParams.set('code', authCode);
    if (sanitizedState) finalRedirectUrl.searchParams.set('state', sanitizedState);

    return NextResponse.json({ redirect: finalRedirectUrl.toString() });

  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error("OAuth Consent POST Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}