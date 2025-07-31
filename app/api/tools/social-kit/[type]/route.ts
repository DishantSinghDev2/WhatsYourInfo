// app/api/tools/social-kit/[type]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

async function getImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}

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
    
    // --- Image Generation Logic ---
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'twitter-header-template.png');
    const templateBuffer = await fs.readFile(templatePath);
    
    const avatarUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/avatars/${user.username}`;
    const avatarBuffer = await getImageBuffer(avatarUrl);

    const roundedAvatar = await sharp(avatarBuffer)
      .resize(200, 200)
      .composite([{
          input: Buffer.from('<svg><circle cx="100" cy="100" r="100"/></svg>'),
          blend: 'dest-in'
      }])
      .png().toBuffer();

    const fullName = `${user.firstName} ${user.lastName}`;
    const profileUrl = `whatsyour.info/${user.username}`;

    // Create text as an SVG image to overlay
    const textSvg = Buffer.from(`
      <svg width="600" height="200">
        <style>
          .title { fill: #fff; font-size: 48px; font-weight: bold; font-family: sans-serif; }
          .subtitle { fill: #eee; font-size: 24px; font-family: sans-serif; }
        </style>
        <text x="0" y="50" class="title">${fullName}</text>
        <text x="0" y="90" class="subtitle">${profileUrl}</text>
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
        'Cache-Control': 'no-cache', // Generate fresh each time
      },
    });

  } catch (error) {
    console.error("Social kit generation error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}