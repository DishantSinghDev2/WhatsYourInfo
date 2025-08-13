import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import redis from '@/lib/redis';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT SANITIZER ---

// --- (2) HELPER FOR XML/HTML ESCAPING ---
// This prevents XSS by ensuring variables are treated as simple strings in the SVG.
const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
};

// List of allowed external domains for avatars to prevent SSRF
const ALLOWED_AVATAR_HOSTS = new Set([
  'pbs.twimg.com',
  'images.unsplash.com',
  'i.imgur.com',
  // Add other trusted image hosting domains here
]);


export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // --- (3) VALIDATE AND SANITIZE ALL INPUTS ---
    const url = new URL(request.url);

    // Sanitize username to prevent NoSQL injection
    const sanitizedUsername = DOMPurify.sanitize(params.username);
    if (!sanitizedUsername) {
        return new NextResponse('Invalid username', { status: 400 });
    }

    // Sanitize and validate size parameter
    const size = Math.max(16, Math.min(512, parseInt(url.searchParams.get('size') || '200', 10)));

    // Sanitize and validate color parameters to prevent XSS
    const hexColorRegex = /^[a-fA-F0-9]{6}$/;
    const unsafeBgColor = url.searchParams.get('backgroundColor') || '3B82F6';
    const unsafeTextColor = url.searchParams.get('color') || 'ffffff';
    const bgColor = hexColorRegex.test(unsafeBgColor) ? unsafeBgColor : '3B82F6';
    const textColor = hexColorRegex.test(unsafeTextColor) ? unsafeTextColor : 'ffffff';

    const cacheKey = `avatar:${sanitizedUsername}:${size}:${bgColor}:${textColor}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return new NextResponse(Buffer.from(cached, 'base64'), {
        headers: {
          'Content-Type': 'image/png', // Assume cached images are PNGs or handle dynamically
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (4) USE SANITIZED USERNAME IN QUERY ---
    const user = await db.collection('users').findOne(
      { username: sanitizedUsername },
      { projection: { avatar: 1 } }
    );

    const defaultSvg = renderSecureSVG(sanitizedUsername, size, bgColor, textColor);
    // Fallback to a default SVG if user or avatar is not found
    if (!user || !user.avatar) {
      return new NextResponse(defaultSvg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    // --- (5) SSRF PROTECTION FOR EXTERNAL URLS ---
    if (user.avatar.startsWith('https://')) {
      try {
        const avatarUrl = new URL(user.avatar);
        // Enforce the whitelist
        if (!ALLOWED_AVATAR_HOSTS.has(avatarUrl.hostname)) {
            throw new Error(`Hostname ${avatarUrl.hostname} is not allowed.`);
        }

        const res = await fetch(avatarUrl.toString()); // Fetch the validated URL
        if (!res.ok) throw new Error('Failed to fetch remote image');

        const contentType = res.headers.get('Content-Type') ?? 'image/png';
        const buffer = await res.arrayBuffer();
        await redis.set(cacheKey, Buffer.from(buffer).toString('base64'), { EX: 86400 });

        return new NextResponse(buffer, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' },
        });

      } catch (fetchError) {
          // If fetching the remote avatar fails for any reason, serve the default SVG
          console.error('SSRF protection or fetch failed:', fetchError);
          return new NextResponse(defaultSvg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
      }
    }

    // R2 logic remains the same as it's a trusted, internal source
    if (user.avatar.startsWith('avatars/')) {
      const r2Url = `${process.env.R2_PUBLIC_URL}/${user.avatar}`;
      const r2Res = await fetch(r2Url);
      if (!r2Res.ok) throw new Error('Failed to fetch R2 image');

      const contentType = r2Res.headers.get('Content-Type') ?? 'image/png';
      const buffer = await r2Res.arrayBuffer();

      await redis.set(cacheKey, Buffer.from(buffer).toString('base64'), { EX: 86400 }); // 24hr TTL


      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Final fallback
    await redis.set(cacheKey, Buffer.from(defaultSvg).toString('base64'), { EX: 86400 });
    return new NextResponse(defaultSvg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
    });

  } catch (error) {
    console.error('Avatar fetch error:', error);
    // Always return a valid, safe SVG on error
    return new NextResponse(renderSecureSVG('error', 200, 'B91C1C', 'ffffff'), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
    });
  }
}

// --- (6) SECURE SVG RENDERING FUNCTION ---
function renderSecureSVG(seed: string, size: number, bgColor: string, textColor: string): string {
  // Sanitize seed just in case, then get initials
  const initials = (seed || '??')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();
  const fontSize = size * 0.4;

  // All dynamic values are escaped to prevent XSS
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