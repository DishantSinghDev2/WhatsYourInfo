// app/api/dashboard/stats/route.ts

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

    // --- Calculate time range (last 30 days) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // --- 1. Aggregate Profile Views ---
    // This assumes you have an 'analytics' collection storing view events.
    const profileViews = await db.collection('profile_views').countDocuments({
      username: user.username,
      timestamp: { $gte: thirtyDaysAgo },
    });

    // --- 2. Aggregate New Leads (only for Pro users) ---
    let newLeads = 0;
    if (user.isProUser) {
      // This assumes you have a 'leads' collection storing lead submissions.
      newLeads = await db.collection('leads').countDocuments({
        userId: new ObjectId(user._id), // Securely query by the authenticated user's ID
        timestamp: { $gte: thirtyDaysAgo },
      });
    }

    // --- 3. Construct the response payload ---
    const stats = {
      profileViews: profileViews,
      newLeads: newLeads,
      accountPlan: user.isProUser ? 'Pro' : 'Free',
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Dashboard stats fetch error:", error);
    return NextResponse.json({ error: 'Failed to retrieve dashboard data.' }, { status: 500 });
  }
}