// app/api/vcard/[username]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

/**
 * --- (2) ENHANCED ESCAPING FUNCTION ---
 * Escapes characters for both vCard format and HTML to prevent XSS.
 * This provides robust, defense-in-depth security.
 */
function escapeVCardString(str: string | undefined | null): string {
  if (!str) return '';
  // First, escape HTML special characters to prevent XSS
  const escapedHtml = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Then, escape vCard special characters
  return escapedHtml
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}


export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username: unsafeUsername } = params;

    // --- (3) VALIDATE AND SANITIZE THE USERNAME INPUT ---
    if (!unsafeUsername) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    const sanitizedUsername = DOMPurify.sanitize(unsafeUsername);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Your projection is an excellent security practice. No changes needed.
    const publicProjection = {
      firstName: 1, lastName: 1, username: 1, bio: 1,
      verifiedAccounts: 1, links: 1,
    };
    
    // --- (4) USE THE SANITIZED USERNAME FOR THE QUERY ---
    const user = await db.collection('users').findOne(
      { username: sanitizedUsername.toLowerCase() },
      { projection: publicProjection }
    );

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // --- Construct the vCard with securely escaped data ---
    const vCard: string[] = [];
    vCard.push('BEGIN:VCARD');
    vCard.push('VERSION:3.0');

    // The escapeVCardString function now handles both vCard and HTML escaping.
    vCard.push(`N:${escapeVCardString(user.lastName)};${escapeVCardString(user.firstName)};;;`);
    vCard.push(`FN:${escapeVCardString(user.firstName)} ${escapeVCardString(user.lastName)}`);
    vCard.push(`PHOTO;VALUE=URI:${process.env.NEXT_PUBLIC_APP_URL}/api/v1/avatars/${user.username}`);
    if (user.bio) {
      vCard.push(`NOTE:${escapeVCardString(user.bio)}`);
    }
    vCard.push(`URL:${process.env.NEXT_PUBLIC_APP_URL}/${user.username}`);

    if (user.links) {
      user.links.forEach((link: { title: string, url: string }) => {
        vCard.push(`URL:${escapeVCardString(link.url)}`);
      });
    }
    if (user.verifiedAccounts) {
      user.verifiedAccounts.forEach((acc: { provider: string, profileUrl: string }) => {
        vCard.push(`X-SOCIALPROFILE;TYPE=${escapeVCardString(acc.provider.toLowerCase())}:${escapeVCardString(acc.profileUrl)}`);
      });
    }

    vCard.push('END:VCARD');
    const vCardString = vCard.join('\r\n');

    const headers = new Headers();
    headers.set('Content-Type', 'text/vcard; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${escapeVCardString(user.username)}.vcf"`);

    return new NextResponse(vCardString, { status: 200, headers });

  } catch (error) {
    console.error('vCard generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}