import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import crypto from 'crypto';

const createClientSchema = z.object({
  name: z.string().min(1, 'Application name is required'),
  description: z.string().min(1, 'Application description is required'),
  redirectUris: z.array(z.string().url('Invalid redirect URI')),
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

    const clients = await db.collection('oauth_clients').find(
      { userId: user._id },
      { sort: { createdAt: -1 } }
    ).toArray();

    return NextResponse.json({
      clients: clients.map(client => ({
        ...client,
        _id: client._id.toString(),
      }))
    });

  } catch (error) {
    console.error('OAuth clients fetch error:', error);
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
    const validatedData = createClientSchema.parse(body);

    // Generate client ID and secret
    const clientId = `wyi_client_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = `wyi_secret_${crypto.randomBytes(32).toString('hex')}`;

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const clientData = {
      userId: user._id,
      name: validatedData.name,
      description: validatedData.description,
      clientId,
      clientSecret,
      redirectUris: validatedData.redirectUris,
      isActive: true,
      createdAt: new Date(),
    };

    const result = await db.collection('oauth_clients').insertOne(clientData);

    return NextResponse.json({
      message: 'OAuth client created successfully',
      client: {
        ...clientData,
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

    console.error('OAuth client creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}