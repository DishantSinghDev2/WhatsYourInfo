import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import redis from '@/lib/redis';
import requestIp from 'request-ip'


export async function POST(request: NextRequest) {
  try {
    const { username, referrer, userAgent } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Get user ID from username
    const user = await db.collection('users').findOne(
      { username },
      { projection: { _id: 1 } }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const viewData = {
      userId: user._id,
      username,
      timestamp: new Date(),
      referrer: referrer || 'direct',
      userAgent: userAgent || 'unknown',
      ip: requestIp.getClientIp(request)
 || 'unknown',
    };

    // Store in MongoDB
    await db.collection('profile_views').insertOne(viewData);

    // Update Redis counters
    const today = new Date().toISOString().split('T')[0];
    await redis.incr(`views:${username}:${today}`);
    await redis.incr(`views:${username}:total`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}