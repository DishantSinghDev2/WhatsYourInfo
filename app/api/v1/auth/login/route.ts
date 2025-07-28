// app/api/v1/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth'; // We reuse your existing JWT generator
import { logApiCall } from '@/lib/logging'; // Your existing logging utility
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header with Bearer token (your API Key) is required.' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is missing.' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Find the API key document in the database
    const apiKeyData = await db.collection('api_keys').findOne({ key: apiKey, isActive: true });

    if (!apiKeyData) {
      return NextResponse.json({ error: 'Invalid or inactive API Key.' }, { status: 401 });
    }

    // Find the user associated with this key
    const user = await db.collection('users').findOne({ _id: new ObjectId(apiKeyData.userId) });

    if (!user) {
      // This is an integrity issue, the key's owner doesn't exist.
      return NextResponse.json({ error: 'Invalid API Key.' }, { status: 401 });
    }

    // --- Authentication Successful ---

    // Log this "login" event as an API call
    logApiCall({
      keyId: apiKeyData._id,
      userId: user._id,
      endpoint: '/api/v1/auth/login',
    });
    
    // Update the 'lastUsed' timestamp for the key
    db.collection('api_keys').updateOne({ _id: apiKeyData._id }, { $set: { lastUsed: new Date() } });

    // Generate a short-lived JWT for subsequent requests
    const token = generateToken({
      userId: user._id.toString(),
      emailVerified: user.emailVerified,
      // You can add a special scope for API access if needed
      scope: 'api_access',
    });

    return NextResponse.json({
      message: 'Authentication successful',
      token_type: 'Bearer',
      access_token: token,
      expires_in: 3600, // Let the developer know the token is valid for 1 hour (3600s)
    });

  } catch (error) {
    console.error('API Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}