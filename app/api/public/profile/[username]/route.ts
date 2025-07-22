import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAvatarUrl } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get user profile from database
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    
    const user = await db.collection('users').findOne(
      { username },
      {
        projection: {
          password: 0, // Never include password
          email: 0,    // Don't expose email in public API
        }
      }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Format public profile data
    const publicProfile = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio || '',
      avatar: user.avatar || getAvatarUrl(user.email || '', 200),
      isProUser: user.isProUser || false,
      customDomain: user.customDomain || null,
      socialLinks: user.socialLinks || {},
      spotlightButton: user.isProUser ? user.spotlightButton : null,
      createdAt: user.createdAt,
      profileUrl: `https://whatsyour.info/${username}`,
      subdomainUrl: `https://${username}.whatsyour.info`,
    };

    // Set cache headers
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