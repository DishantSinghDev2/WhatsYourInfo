// app/api/tools/social-kit/[type]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT SANITIZER ---

async function getImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * --- (2) CRITICAL SECURITY FUNCTION ---
 * Escapes characters that have special meaning in XML/HTML/SVG to prevent XSS.
 * @param unsafe - The raw string from the user's data.
 * @returns A string that is safe to embed in an SVG text element.
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
  { params }: { params: { type: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { type } = params;
    if (type !== 'twitter-header') {
      return new NextResponse('Unsupported kit type', { status: 400 });
    }
    
    // --- (3) SANITIZE USERNAME BEFORE USING IN A URL ---
    const sanitizedUsername = DOMPurify.sanitize(user.username);
    
    // --- Image Generation Logic ---
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'twitter-header-template.png');
    const templateBuffer = await fs.readFile(templatePath);
    
    const avatarUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/avatars/${sanitizedUsername}`;
    const avatarBuffer = await getImageBuffer(avatarUrl);

    const roundedAvatar = await sharp(avatarBuffer)
      .resize(200, 200)
      .composite([{
          input: Buffer.from('<svg><circle cx="100" cy="100" r="100"/></svg>'),
          blend: 'dest-in'
      }])
      .png().toBuffer();

    // --- (4) SANITIZE ALL DATA BEFORE PLACING IN SVG ---
    const sanitizedFullName = escapeXml(`${user.firstName} ${user.lastName}`);
    const sanitizedProfileUrl = escapeXml(`whatsyour.info/${sanitizedUsername}`);

    // Create text as an SVG image to overlay using the sanitized data
    const textSvg = Buffer.from(`
      <svg width="600" height="200">
        <style>
          .title { fill: #fff; font-size: 48px; font-weight: bold; font-family: sans-serif; }
          .subtitle { fill: #eee; font-size: 24px; font-family: sans-serif; }
        </style>
        <text x="0" y="50" class="title">${sanitizedFullName}</text>
        <text x="0" y="90" class="subtitle">${sanitizedProfileUrl}</text>
      </svg>
    `);

    const finalImage = await sharp(templateBuffer)
      .composite([
        { input: roundedAvatar, top: 150, left: 150 },
        { input: textSvg, top: 180, left: 400 }
      ])
      .png()
      .toBuffer();

    return new NextResponse(finalImage, {
      status: 200,
      headers: { 
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("Social kit generation error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}