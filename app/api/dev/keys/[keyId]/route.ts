import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { keyId } = params;

    if (!ObjectId.isValid(keyId)) {
      return NextResponse.json(
        { error: 'Invalid key ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const result = await db.collection('api_keys').deleteOne({
      _id: new ObjectId(keyId),
      userId: user._id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'API key deleted successfully'
    });

  } catch (error) {
    console.error('API key deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}