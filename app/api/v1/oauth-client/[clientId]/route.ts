// app/api/v1/oauth-client/[clientId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET: Fetches public details for a single OAuth client
export async function GET(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const { clientId } = params;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const oauthClient = await db.collection('oauth_clients').findOne(
      { clientId },
      // Projection: Ensure sensitive data like clientSecret is NEVER exposed
      {
        projection: {
          clientSecret: 0,
          userId: 0,
          isInternal: 0,
          isActive: 0
        }
      }
    );

    if (!oauthClient) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Convert ObjectId to string for JSON serialization
    const clientData = {
        ...oauthClient,
        _id: oauthClient._id.toString(),
    };

    return NextResponse.json(clientData);

  } catch (error) {
    console.error('Failed to fetch OAuth client:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}