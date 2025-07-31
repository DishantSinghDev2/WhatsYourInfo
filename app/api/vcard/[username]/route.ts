// app/api/vcard/[username]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * Escapes special characters in a string for use in a vCard file.
 * Newlines, commas, and semicolons need to be escaped.
 * @param str The string to escape.
 * @returns The escaped string.
 */
function escapeVCardString(str: string | undefined | null): string {
  if (!str) return '';
  return str
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
    const { username } = params;
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- Securely fetch only the necessary public data ---
    // Use a projection to ensure no sensitive data is ever pulled from the DB.
    const user = await db.collection('users').findOne(
      { username: username.toLowerCase() },
      {
        projection: {
          firstName: 1,
          lastName: 1,
          username: 1,
          bio: 1,
          verifiedAccounts: 1,
          links: 1,
          // IMPORTANT: We DO NOT fetch the user's private email address.
        }
      }
    );

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // --- Construct the vCard string line by line ---
    const vCard: string[] = [];
    vCard.push('BEGIN:VCARD');
    vCard.push('VERSION:3.0');

    // Full Name and Structured Name
    vCard.push(`N:${escapeVCardString(user.lastName)};${escapeVCardString(user.firstName)};;;`);
    vCard.push(`FN:${escapeVCardString(user.firstName)} ${escapeVCardString(user.lastName)}`);

    // Profile Photo (using a URL is widely supported and efficient)
    vCard.push(`PHOTO;VALUE=URI:${process.env.NEXT_PUBLIC_APP_URL}/api/v1/avatars/${user.username}`);

    // Bio/Note
    if (user.bio) {
      vCard.push(`NOTE:${escapeVCardString(user.bio)}`);
    }

    // Primary Profile URL
    vCard.push(`URL:${process.env.NEXT_PUBLIC_APP_URL}/${user.username}`);

    // Add other custom links (e.g., portfolio, blog)
    if (user.links && user.links.length > 0) {
      user.links.forEach((link: { title: string, url: string }) => {
        // Add each link with its title as a label if possible, or just the URL.
        // For simplicity, we add them as generic URLs.
        vCard.push(`URL:${link.url}`);
      });
    }

    // Add verified social media profiles
    if (user.verifiedAccounts && user.verifiedAccounts.length > 0) {
      user.verifiedAccounts.forEach((acc: { provider: string, profileUrl: string }) => {
        // Use the standard X-SOCIALPROFILE property for social media
        vCard.push(`X-SOCIALPROFILE;TYPE=${acc.provider.toLowerCase()}:${acc.profileUrl}`);
      });
    }

    // vCard Footer
    vCard.push(`END:VCARD`);

    // Join all lines with the correct line ending for vCards (CRLF)
    const vCardString = vCard.join('\r\n');

    // --- Create the response with correct headers for downloading ---
    const headers = new Headers();
    headers.set('Content-Type', 'text/vcard; charset=utf-8');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${user.username}.vcf"`
    );

    return new NextResponse(vCardString, { status: 200, headers });

  } catch (error) {
    console.error('vCard generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}