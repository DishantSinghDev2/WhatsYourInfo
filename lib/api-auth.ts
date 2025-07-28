// lib/api-auth.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logApiCall } from '@/lib/logging';
import jwt from 'jsonwebtoken';

// --- Rate Limit Configuration ---
const FREE_TIER = { hourly: 100, daily: 1000 };
const PRO_TIER = { hourly: 1000, daily: 10000 };


// Unchanged. This is for JWTs, which are checked *after* the initial login.

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
  };
  apiKey: {
    _id: ObjectId;
    name: string;
  };
}

export type AuthResult = 
  | { status: 'success'; data: AuthenticatedApiRequest }
  | { status: 'failure'; reason: 'INVALID_KEY' | 'RATE_LIMIT_EXCEEDED'; message: string; limit?: number; remaining?: number; reset?: Date };

/**
 * Authenticates a request using an API key and enforces both hourly and daily rate limits.
 * If successful, it logs the API call and returns the user and key data.
 * @param request The incoming NextRequest.
 * @returns An AuthResult object indicating success or failure reason.
 */
export async function authenticateApiKey(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 'failure', reason: 'INVALID_KEY', message: 'Authorization header is missing or invalid.' };
  }

  const key = authHeader.split(' ')[1];
  if (!key) {
    return { status: 'failure', reason: 'INVALID_KEY', message: 'API Key is missing from Bearer token.' };
  }

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  const apiKeyData = await db.collection('api_keys').findOne({ key, isActive: true });
  if (!apiKeyData) {
    return { status: 'failure', reason: 'INVALID_KEY', message: 'Invalid or inactive API Key.' };
  }
  
  const userData = await db.collection('users').findOne(
    { _id: new ObjectId(apiKeyData.userId) },
    { projection: { _id: 1, isProUser: 1 } }
  );
  if (!userData) {
    return { status: 'failure', reason: 'INVALID_KEY', message: 'Invalid API Key.' };
  }

  // --- RATE LIMITING LOGIC ---
  const planLimits = userData.isProUser ? PRO_TIER : FREE_TIER;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Perform both counts concurrently
  const [hourlyCount, dailyCount] = await Promise.all([
      db.collection('api_calls').countDocuments({
        keyId: apiKeyData._id,
        timestamp: { $gte: oneHourAgo }
      }),
      db.collection('api_calls').countDocuments({
        keyId: apiKeyData._id,
        timestamp: { $gte: oneDayAgo }
      })
  ]);

  // Check daily limit first
  if (dailyCount >= planLimits.daily) {
    const nextDay = new Date(oneDayAgo.getTime() + 24 * 60 * 60 * 1000);
    return {
      status: 'failure',
      reason: 'RATE_LIMIT_EXCEEDED',
      message: `Daily rate limit of ${planLimits.daily} requests exceeded.`,
      limit: planLimits.daily,
      remaining: 0,
      reset: nextDay
    };
  }
  
  // Then check hourly limit
  if (hourlyCount >= planLimits.hourly) {
    const nextHour = new Date(oneHourAgo.getTime() + 60 * 60 * 1000);
    return {
      status: 'failure',
      reason: 'RATE_LIMIT_EXCEEDED',
      message: `Hourly rate limit of ${planLimits.hourly} requests exceeded.`,
      limit: planLimits.hourly,
      remaining: 0,
      reset: nextHour
    };
  }

  // --- AUTHENTICATION SUCCEEDS ---

  logApiCall({
    keyId: apiKeyData._id,
    userId: userData._id,
    endpoint: request.nextUrl.pathname,
  });

  db.collection('api_keys').updateOne({ _id: apiKeyData._id }, { $set: { lastUsed: new Date() } });

  return {
    status: 'success',
    data: {
      user: { _id: userData._id, isProUser: userData.isProUser },
      apiKey: { _id: apiKeyData._id, name: apiKeyData.name },
    }
  };
}
