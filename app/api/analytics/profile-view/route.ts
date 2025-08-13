// app/api/analytics/view/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import redis from '@/lib/redis';
import requestIp from 'request-ip';
import { z } from 'zod'; // --- (1) IMPORT ZOD & SANITIZER ---
import DOMPurify from 'isomorphic-dompurify';

// --- (2) DEFINE A STRICT SCHEMA FOR THE REQUEST BODY ---
// This enforces types and length limits to prevent data pollution.
const viewSchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  referrer: z.string().trim().max(500, "Referrer is too long.").optional(),
  userAgent: z.string().trim().max(500, "User agent is too long.").optional(),
});

export async function POST(request: NextRequest) {
  try {
    // IMPORTANT: A rate limiter should be implemented here for public endpoints
    // to prevent abuse and spam. For example:
    // const ip = requestIp.getClientIp(request) || 'unknown';
    // const { success } = await rateLimiter.limit(ip);
    // if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await request.json();
    // --- (3) VALIDATE THE REQUEST BODY ---
    const validatedData = viewSchema.parse(body);

    // --- (4) SANITIZE ALL USER-PROVIDED STRINGS ---
    // This is the critical step to prevent XSS and injection attacks.
    const sanitizedUsername = DOMPurify.sanitize(validatedData.username);
    const sanitizedReferrer = validatedData.referrer ? DOMPurify.sanitize(validatedData.referrer) : 'direct';
    const sanitizedUserAgent = validatedData.userAgent ? DOMPurify.sanitize(validatedData.userAgent) : 'unknown';

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (5) USE THE SANITIZED USERNAME FOR THE DB QUERY ---
    const user = await db.collection('users').findOne(
      { username: sanitizedUsername },
      { projection: { _id: 1 } }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // --- (6) STORE THE SANITIZED DATA ---
    const viewData = {
      userId: user._id,
      username: sanitizedUsername,
      timestamp: new Date(),
      referrer: sanitizedReferrer,
      userAgent: sanitizedUserAgent,
      ip: requestIp.getClientIp(request) || 'unknown',
    };

    await db.collection('profile_views').insertOne(viewData);

    // Use the sanitized username for Redis keys
    const today = new Date().toISOString().split('T')[0];
    await redis.incr(`views:${sanitizedUsername}:${today}`);
    await redis.incr(`views:${sanitizedUsername}:total`);

    return NextResponse.json({ success: true });

  } catch (error) {
    // Add specific Zod error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}