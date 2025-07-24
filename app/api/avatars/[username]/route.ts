import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const url = new URL(request.url);
    const size = Math.max(16, Math.min(512, parseInt(url.searchParams.get('size') || '200')));

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Look up user and avatar
    const user = await db.collection('users').findOne(
      { username },
      { projection: { avatar: 1, email: 1 } }
    );

    if (!user || !user.avatar) {
      return getDefaultAvatar(username, size);
    }

    // 1. Full URL avatar (e.g. uploaded to external storage)
    if (user.avatar.startsWith('https://')) {
      return NextResponse.redirect(user.avatar);
    }

    // 2. Stored in Cloudflare R2 via Worker (path format: avatars/username-timestamp.ext)
    if (user.avatar.startsWith('avatars/')) {
      const avatarUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${user.avatar}`;
      return NextResponse.redirect(avatarUrl);
    }

    // 3. Fallback
    return getDefaultAvatar(username, size);

  } catch (error) {
    console.error('Avatar fetch error:', error);
    return getDefaultAvatar('default', 200);
  }
}

function getDefaultAvatar(seed: string, size: number) {
  const defaultAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    seed
  )}&size=${size}&backgroundColor=3B82F6&color=ffffff`;
  return NextResponse.redirect(defaultAvatarUrl);
}
