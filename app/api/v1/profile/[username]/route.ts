import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- BEST PRACTICE: Use an "allowlist" projection to only fetch public data ---
    // This is much safer than trying to exclude fields.
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
      wallet: 1, // We fetch the wallet and its flag...
      showWalletOnPublic: 1, // ...to decide if it should be public later.
      links: 1,
      gallery: 1,
      interests: 1,
      createdAt: 1, // It's generally safe to show when a profile was created.
    };
    
    const user = await db.collection('users').findOne(
      { username: username.toLowerCase() },
      { projection: publicProjection }
    );

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // --- Post-process the data to create the final public profile ---

    // Conditionally include the wallet based on the user's setting
    if (!user.showWalletOnPublic) {
      delete user.wallet;
    }
    // Always remove the setting flag itself from the public response
    delete user.showWalletOnPublic;

    // Construct the final, safe public profile object
    const publicProfile = {
      ...user,
      _id: user._id.toString(),
      // Construct the public avatar URL
      avatar: `https://whatsyour.info/api/avatars/${user.username}`,
      // Add other helpful public URLs
      profileUrl: `https://whatsyour.info/${user.username}`,
      subdomainUrl: `https://${user.username}.whatsyour.info`,
    };

    // Set cache headers
    const response = NextResponse.json(publicProfile);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600' // Cache for 5 mins, revalidate up to 10 mins
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