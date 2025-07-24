import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get('size') || '200');

    // Validate size parameter
    if (size < 16 || size > 512) {
      return NextResponse.json(
        { error: 'Size must be between 16 and 512 pixels' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Get user's avatar from database
    const user = await db.collection('users').findOne(
      { username },
      { projection: { avatar: 1, email: 1 } }
    );

    if (!user) {
      // Return default avatar for non-existent users
      return getDefaultAvatar(size);
    }

    if (user.avatar && user.avatar.startsWith('https://')) {
      // User has custom avatar - redirect to it
      return NextResponse.redirect(user.avatar);
    }

    // Generate avatar from Cloudflare R2 or return default
    if (user.avatar && user.avatar.startsWith('avatars/')) {
      // Construct Cloudflare R2 URL
      const avatarUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${user.avatar}?width=${size}&height=${size}&fit=crop`;
      return NextResponse.redirect(avatarUrl);
    }

    // Return default avatar
    return getDefaultAvatar(size);

  } catch (error) {
    console.error('Avatar fetch error:', error);
    return getDefaultAvatar(200);
  }
}

function getDefaultAvatar(size: number) {
  // Generate a simple default avatar using a service like DiceBear or return a static default
  const defaultAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=default&size=${size}&backgroundColor=3B82F6&color=ffffff`;
  
  return NextResponse.redirect(defaultAvatarUrl);
}