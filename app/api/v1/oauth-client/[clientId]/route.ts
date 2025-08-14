// app/api/v1/oauth-client/[clientId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// GET: Fetches public details for a single OAuth client
export async function GET(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const { clientId: unsafeClientId } = params;

    // --- (2) VALIDATE AND SANITIZE THE INPUT ---
    if (!unsafeClientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }
    // Sanitize the input to strip any characters that could be interpreted as a query object.
    const sanitizedClientId = DOMPurify.sanitize(unsafeClientId);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (3) SUGGESTION: Use an "allow-list" projection for even better security ---
    // This explicitly states what is public, preventing accidental leaks if new fields are added.
    const publicProjection = {
        name: 1,
        description: 1,
        appLogo: 1,
        homepageUrl: 1,
        clientId: 1,
        grantedScopes: 1,
        users: 1,
        opByWYI: 1,
        createdAt: 1
    };

    // --- (4) USE THE SANITIZED CLIENT ID IN THE QUERY ---
    const oauthClient = await db.collection('oauth_clients').findOne(
      { clientId: sanitizedClientId },
      { projection: publicProjection } // Using the safer allow-list projection
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