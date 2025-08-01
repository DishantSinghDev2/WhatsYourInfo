// app/api/v1/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { authenticateApiKey } from '@/lib/api-auth'; // The updated middleware

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);

    // --- Handle Authentication Failures ---
    if (authResult.status === 'failure') {
      if (authResult.reason === 'RATE_LIMIT_EXCEEDED') {
        const response = NextResponse.json(
          { error: authResult.message }, // Use the specific message from the auth function
          { status: 429 } // 429 Too Many Requests
        );
        // Add helpful rate-limiting headers to the response
        response.headers.set('X-RateLimit-Limit', authResult.limit?.toString() || '0');
        response.headers.set('X-RateLimit-Remaining', authResult.remaining?.toString() || '0');
        response.headers.set('X-RateLimit-Reset', authResult.reset?.getTime().toString() || '0');
        return response;
      }

      // Handle invalid keys
      return NextResponse.json({ error: authResult.message }, { status: 401 });
    }

    // --- Handle Authentication Success ---
    const { user } = authResult.data;
    const scope = 'profile:read profile:write email:read links:read links:write';

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    const token = await new SignJWT({
      scope: scope, // The permissions granted to this token
    })
      .setProtectedHeader({ alg: 'HS256' }) // Explicitly set the algorithm to HS256
      .setSubject(user._id.toHexString()) // 'sub' (Subject) is the standard claim for the user's ID
      .setIssuedAt() // 'iat' (Issued At) sets the token creation time
      .setExpirationTime('1h') // 'exp' (Expiration Time) sets the token to expire in 1 hour
      .sign(secret);

    return NextResponse.json({
      message: 'Authentication successful',
      token_type: 'Bearer',
      access_token: token,
      expires_in: 3600,
    });

  } catch (error) {
    console.error('API Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}