import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromToken(request);

    if (!user || user._id !== params.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const leads = await db.collection('leads')
      .find({ userId: user._id })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({
      leads: leads.map(lead => ({
        ...lead,
        _id: lead._id.toString(),
      }))
    });

  } catch (error) {
    console.error('Leads fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}