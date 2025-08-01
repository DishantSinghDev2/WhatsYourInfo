import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthInEdge } from '@/lib/edge-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthInEdge(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        _id: user.userId,
      }
    });

  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}