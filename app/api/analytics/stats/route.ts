import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import redis from '@/lib/redis';

export async function GET(
  request: NextRequest
) {
  try {
    const user = await getUserFromToken(request);

    if (!user && !user?.username) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Get total views from Redis
    const totalViews = await redis.get(`views:${user?.username}:total`) || '0';
    
    // Get today's views
    const today = new Date().toISOString().split('T')[0];
    const todayViews = await redis.get(`views:${user?.username}:${today}`) || '0';

    // Get recent views from MongoDB
    const recentViews = await db.collection('profile_views')
      .find({ username: user?.username })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Get views by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsByDay = await db.collection('profile_views').aggregate([
      {
        $match: {
          username: user?.username,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    // Get referrer stats
    const referrerStats = await db.collection('profile_views').aggregate([
      {
        $match: {
          username: user?.username,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: "$referrer",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();

    return NextResponse.json({
      totalViews: parseInt(totalViews),
      todayViews: parseInt(todayViews),
      recentViews: recentViews.map(view => ({
        timestamp: view.timestamp,
        referrer: view.referrer,
        userAgent: view.userAgent
      })),
      viewsByDay: viewsByDay.map(item => ({
        date: item._id,
        views: item.count
      })),
      referrerStats: referrerStats.map(item => ({
        referrer: item._id,
        count: item.count
      }))
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}