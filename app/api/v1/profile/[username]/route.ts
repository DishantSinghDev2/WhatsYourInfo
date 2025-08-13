// app/api/v1/profile/[username]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // --- (2) VALIDATE AND SANITIZE THE USERNAME INPUT ---
    if (!params.username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    // Sanitize the input to strip any characters that could be interpreted as a query object.
    const sanitizedUsername = DOMPurify.sanitize(params.username);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // This projection is an excellent security practice. No changes needed.
    const publicProjection = {
      username: 1,
      firstName: 1,
      lastName: 1,
      bio: 1,
      isProUser: 1,
      emailVerified: 1,
      spotlightButton: 1,
      design: 1,
      verifiedAccounts: 1,
      wallet: 1,
      showWalletOnPublic: 1,
      links: 1,
      gallery: 1,
      interests: 1,
      createdAt: 1,
    };
    
    // --- (3) USE THE SANITIZED USERNAME FOR THE DATABASE QUERY ---
    const user = await db.collection('users').findOne(
      { username: sanitizedUsername.toLowerCase() },
      { projection: publicProjection }
    );

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // Your post-processing logic is excellent. No changes needed.
    if (!user.showWalletOnPublic) {
      delete user.wallet;
    }
    delete user.showWalletOnPublic;

    const publicProfile = {
      ...user,
      _id: user._id.toString(),
      avatar: `https://whatsyour.info/api/v1/avatars/${user.username}`,
      profileUrl: `https://whatsyour.info/${user.username}`,
      subdomainUrl: `https://${user.username}.whatsyour.info`,
    };

    const response = NextResponse.json(publicProfile);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );

    return response;

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}