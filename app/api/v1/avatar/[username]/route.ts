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
    const bgColor = url.searchParams.get('backgroundColor') || '3B82F6';
    const textColor = url.searchParams.get('color') || 'ffffff';

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const user = await db.collection('users').findOne(
      { username },
      { projection: { avatar: 1 } }
    );

    // === SVG fallback ===
    if (!user || !user.avatar) {
      return new NextResponse(renderSharpSVG(username, size, bgColor, textColor), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // === Serve remote image from external URL ===
    if (user.avatar.startsWith('https://')) {
      const res = await fetch(user.avatar);
      if (!res.ok) throw new Error('Failed to fetch remote image');

      const contentType = res.headers.get('Content-Type') ?? 'image/png';
      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // === Serve image from R2 ===
    if (user.avatar.startsWith('avatars/')) {
      const r2Url = `${process.env.R2_PUBLIC_URL}/${user.avatar}`;
      const r2Res = await fetch(r2Url);
      if (!r2Res.ok) throw new Error('Failed to fetch R2 image');

      const contentType = r2Res.headers.get('Content-Type') ?? 'image/png';
      const buffer = await r2Res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // === Fallback to SVG if unknown format ===
    return new NextResponse(renderSharpSVG(username, size, bgColor, textColor), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    });

  } catch (error) {
    console.error('Avatar fetch error:', error);
    return new NextResponse(renderSharpSVG('default', 200, '3B82F6', 'ffffff'), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

function renderSharpSVG(seed: string, size: number, bgColor: string, textColor: string): string {
  const initials = (seed || '??')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();
  const fontSize = size * 0.4;

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${bgColor}" />
      <text
        x="50%" y="52%"
        font-family="sans-serif"
        font-size="${fontSize}"
        fill="#${textColor}"
        dominant-baseline="middle"
        text-anchor="middle"
        font-weight="bold"
      >
        ${initials}
      </text>
    </svg>
  `.trim();
}
