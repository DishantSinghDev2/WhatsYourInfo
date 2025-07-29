// app/api/v1/oauth-client/[clientId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const oauthClient = await db.collection('oauth_clients').findOne(
      { clientId },
      // IMPORTANT: Only project fields that are safe to be public
      { projection: { name: 1, appLogo: 1, homepageUrl: 1, description: 1 } }
    );

    if (!oauthClient) {
      return NextResponse.json({ error: 'OAuth client not found' }, { status: 404 });
    }

    return NextResponse.json(oauthClient);

  } catch (error) {
    console.error('Public OAuth client fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}