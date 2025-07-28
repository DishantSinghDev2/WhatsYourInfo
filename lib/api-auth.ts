// lib/api-auth.ts

import { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logApiCall } from '@/lib/logging'; // We will create this next
import jwt from 'jsonwebtoken';

/**
 * Extracts and verifies a JWT from an 'Authorization: Bearer <token>' header.
 * This is used to protect developer API endpoints (/api/v1/*).
 * @param request The incoming NextRequest.
 * @returns The decoded token payload if valid, otherwise null.
 */
export function verifyApiToken(request: NextRequest): { userId: string; [key: string]: any } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { userId: string; [key: string]: any };
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

export interface AuthenticatedApiRequest {
  user: {
    _id: ObjectId;
    isProUser: boolean;
    // ... other user fields you might need
  };
  apiKey: {
    _id: ObjectId;
    name: string;
  };
}

/**
 * Authenticates a request using an API key from the Authorization header.
 * If successful, it logs the API call and returns the user and key data.
 * @param request The incoming NextRequest.
 * @returns The authenticated user and API key data, or null if auth fails.
 */
export async function authenticateApiKey(request: NextRequest): Promise<AuthenticatedApiRequest | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const key = authHeader.split(' ')[1];
  if (!key) {
    return null;
  }

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  // Find the API key in the database
  const apiKeyData = await db.collection('api_keys').findOne({ key, isActive: true });
  if (!apiKeyData) {
    return null;
  }
  
  // Find the user who owns the key
  const userData = await db.collection('users').findOne(
    { _id: new ObjectId(apiKeyData.userId) },
    { projection: { _id: 1, isProUser: 1 } } // Only fetch necessary fields
  );
  if (!userData) {
    return null;
  }

  // --- LOG THE API CALL (Fire-and-forget) ---
  // We don't await this so it doesn't slow down the response.
  logApiCall({
    keyId: apiKeyData._id,
    userId: userData._id,
    endpoint: request.nextUrl.pathname,
  });

  // Update the 'lastUsed' timestamp for the key
  db.collection('api_keys').updateOne({ _id: apiKeyData._id }, { $set: { lastUsed: new Date() } });

  return {
    user: { _id: userData._id, isProUser: userData.isProUser },
    apiKey: { _id: apiKeyData._id, name: apiKeyData.name },
  };
}