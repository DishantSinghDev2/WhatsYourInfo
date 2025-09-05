// app/api/v1/avatars/[identifier]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_AVATAR_HOSTS = new Set([
  'm.wyi.dishis.tech',
]);

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const url = new URL(request.url);

    // Sanitize the identifier, which can be a username or an email
    const sanitizedIdentifier = DOMPurify.sanitize(params.identifier);

    // Validate size parameter, ensuring it's within a safe range
    const size = Math.max(16, Math.min(512, parseInt(url.searchParams.get('size') || '200', 10)));

    // Validate color parameters using a regex to prevent injection
    const hexColorRegex = /^[a-fA-F0-9]{3,6}$/;
    const unsafeBgColor = url.searchParams.get('backgroundColor') || '3B82F6';
    const unsafeTextColor = url.searchParams.get('color') || 'ffffff';
    const bgColor = hexColorRegex.test(unsafeBgColor) ? unsafeBgColor : '3B82F6';
    const textColor = hexColorRegex.test(unsafeTextColor) ? unsafeTextColor : 'ffffff';

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Query for the user by either username or email
    const user = await db.collection('users').findOne(
      {
        $or: [
          { username: sanitizedIdentifier },
          { email: sanitizedIdentifier }
        ]
      },
      { projection: { avatar: 1, username: 1 } } // Also fetch username for initials
    );

    const defaultSvg = renderSecureSVG(user ? user.username : sanitizedIdentifier, size, bgColor, textColor);

    if (!user || !user.avatar) {
      return new NextResponse(defaultSvg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    if (user.avatar.startsWith('https://')) {
      try {
        const avatarUrl = new URL(user.avatar);
        if (!ALLOWED_AVATAR_HOSTS.has(avatarUrl.hostname)) {
          throw new Error(`Hostname not allowed: ${avatarUrl.hostname}`);
        }

        const res = await fetch(avatarUrl.toString());
        if (!res.ok) throw new Error('Failed to fetch remote image');
        const contentType = res.headers.get('Content-Type') ?? 'image/png';
        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' },
        });
      } catch (fetchError) {
        console.error("External avatar fetch failed:", fetchError);
        return new NextResponse(defaultSvg, { headers: { 'Content-Type': 'image/svg+xml' } });
      }
    }

    if (user.avatar.startsWith('avatars/')) {
      const r2Url = `${process.env.R2_PUBLIC_URL}/${user.avatar}`;
      const r2Res = await fetch(r2Url);
      if (!r2Res.ok) throw new Error('Failed to fetch R2 image');

      const contentType = r2Res.headers.get('Content-Type') ?? 'image/png';
      const buffer = await r2Res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' },
      });
    }

    return new NextResponse(defaultSvg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
    });

  } catch (error) {
    console.error('Avatar fetch error:', error);
    const errorSvg = renderSecureSVG('error', 200, 'B91C1C', 'ffffff');
    return new NextResponse(errorSvg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
    });
  }
}

function renderSecureSVG(seed: string, size: number, bgColor: string, textColor: string): string {
  const initials = (seed || '??').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
  const fontSize = size * 0.4;

  return `
    <svg width="${escapeXml(String(size))}" height="${escapeXml(String(size))}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${escapeXml(bgColor)}" />
      <text
        x="50%" y="52%"
        font-family="sans-serif"
        font-size="${escapeXml(String(fontSize))}"
        fill="#${escapeXml(textColor)}"
        dominant-baseline="middle"
        text-anchor="middle"
        font-weight="bold"
      >${escapeXml(initials)}</text>
    </svg>
  `.trim();
}