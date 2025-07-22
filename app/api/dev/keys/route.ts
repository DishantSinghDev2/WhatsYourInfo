import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import crypto from 'crypto';

const createKeySchema = z.object({
  name: z.string().min(1, 'API key name is required'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const keys = await db.collection('api_keys').find(
      { userId: user._id },
      { sort: { createdAt: -1 } }
    ).toArray();

    return NextResponse.json({
      keys: keys.map(key => ({
        ...key,
        _id: key._id.toString(),
      }))
    });

  } catch (error) {
    console.error('API keys fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createKeySchema.parse(body);

    // Generate API key
    const apiKey = `wyi_${crypto.randomBytes(32).toString('hex')}`;

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const keyData = {
      userId: user._id,
      name: validatedData.name,
      key: apiKey,
      isActive: true,
      createdAt: new Date(),
      lastUsed: null,
    };

    const result = await db.collection('api_keys').insertOne(keyData);

    return NextResponse.json({
      message: 'API key created successfully',
      key: {
        ...keyData,
        _id: result.insertedId.toString(),
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('API key creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}