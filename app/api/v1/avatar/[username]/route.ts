// app/api/v1/avatars/[username]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT SANITIZER ---

// --- (2) DEFINE A WHITELIST FOR ALLOWED AVATAR HOSTS TO PREVENT SSRF ---
const ALLOWED_AVATAR_HOSTS = new Set([
  'm.wyi.dishis.tech',
]);

/**
 * --- (3) CREATE A SECURE XML/SVG ESCAPING FUNCTION ---
 * This is crucial for preventing XSS when generating the SVG.
 */
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
  { params }: { params: { username: string } }
) {
  try {
    // --- (4) VALIDATE AND SANITIZE ALL INPUTS ---
    const url = new URL(request.url);

    // Sanitize username to prevent NoSQL injection
    const sanitizedUsername = DOMPurify.sanitize(params.username);

    // Validate size parameter
    const size = Math.max(16, Math.min(512, parseInt(url.searchParams.get('size') || '200', 10)));

    // Validate color parameters with a regex to prevent XSS/injection
    const hexColorRegex = /^[a-fA-F0-9]{3,6}$/;
    const unsafeBgColor = url.searchParams.get('backgroundColor') || '3B82F6';
    const unsafeTextColor = url.searchParams.get('color') || 'ffffff';
    const bgColor = hexColorRegex.test(unsafeBgColor) ? unsafeBgColor : '3B82F6';
    const textColor = hexColorRegex.test(unsafeTextColor) ? unsafeTextColor : 'ffffff';

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Use the sanitized username for the database query
    const user = await db.collection('users').findOne(
      { username: sanitizedUsername },
      { projection: { avatar: 1 } }
    );

    const defaultSvg = renderSecureSVG(sanitizedUsername, size, bgColor, textColor);

    if (!user || !user.avatar) {
      return new NextResponse(defaultSvg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    // --- (5) SSRF PROTECTION ---
    if (user.avatar.startsWith('https://')) {
      try {
        const avatarUrl = new URL(user.avatar);
        // Enforce the hostname whitelist
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
        // If fetching the external URL fails for any reason, serve the safe default SVG.
        return new NextResponse(defaultSvg, { headers: { 'Content-Type': 'image/svg+xml' } });
      }
    }

    // Serve image from your trusted R2 source
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

    // Final fallback for any other case
    return new NextResponse(defaultSvg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
    });

  } catch (error) {
    console.error('Avatar fetch error:', error);
    return new NextResponse(renderSecureSVG('error', 200, 'B91C1C', 'ffffff'), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
    });
  }
}

// --- (6) A SECURE SVG RENDERING FUNCTION ---
function renderSecureSVG(seed: string, size: number, bgColor: string, textColor: string): string {
  // Sanitize seed and get initials
  const initials = (seed || '??').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
  const fontSize = size * 0.4;

  // Use the escapeXml helper on ALL dynamic content to prevent XSS
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