// app/api/dev/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const userId = new ObjectId(user._id);

    // --- Time range for stats (last 30 days) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // --- Perform all aggregations concurrently for maximum efficiency ---
    const [apiKeysCount, oauthClientsCount, apiCallsCount] = await Promise.all([
      // 1. Count total active API keys for the user
      db.collection('api_keys').countDocuments({ userId }),
      
      // 2. Count total active OAuth clients for the user
      db.collection('oauth_clients').countDocuments({ userId }),

      // 3. Count API calls in the last 30 days made with this user's keys
      db.collection('api_calls').countDocuments({ 
        userId, // Assumes userId is stored in the api_calls log for efficiency
        timestamp: { $gte: thirtyDaysAgo }
      })
    ]);

    // --- Construct the final response payload ---
    const stats = {
      apiKeys: apiKeysCount,
      oauthClients: oauthClientsCount,
      apiCalls: apiCallsCount,
      rateLimit: user.isProUser ? '1,000/hr': '100/hr', // This can be static or dynamic based on user plan
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Developer stats fetch error:", error);
    return NextResponse.json({ error: 'Failed to retrieve developer stats.' }, { status: 500 });
  }
}