// lib/edge-auth.ts (NEW FILE)

import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // We can't throw an error at the top level in the Edge runtime
  // The check will happen inside the function
  console.error("JWT_SECRET is not set in environment variables!");
}
const secretKey = new TextEncoder().encode(JWT_SECRET || '');

/**
 * Verifies the JWT from the auth-token cookie.
 * This is designed specifically and ONLY for the Edge runtime (middleware).
 * @param request The incoming NextRequest.
 * @returns The decoded payload if the token is valid, otherwise null.
 */
export async function verifyAuthInEdge(request: NextRequest): Promise<any | null> {
  const token = request.cookies.get('auth-token')?.value;

  if (!token || !JWT_SECRET) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256']
    });
    return payload;
  } catch (error) {
    // This is expected for invalid/expired tokens, so we don't need to log it every time.
    return null;
  }
}