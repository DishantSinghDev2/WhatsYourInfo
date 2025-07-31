// app/qr/[username]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const LOGO_SIZE_RATIO = 0.25; // 25% of the QR code's width
const QR_CODE_SIZE = 512; // Output size in pixels
const QR_CODE_MARGIN = 2;   // QR code margin (modules)

/**
 * Fetches an image from a URL and returns it as a Buffer.
 * This is used to get the user's avatar.
 */
async function getImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Failed to fetch image from ${url}:`, error);
    return null;
  }
}

/**
 * Loads the local logo file and returns it as a Buffer.
 * Caches the logo in memory to avoid repeated file reads.
 */
let logoBufferCache: Buffer | null = null;
async function getLogoBuffer(): Promise<Buffer | null> {
  if (logoBufferCache) {
    return logoBufferCache;
  }
  try {
    // Assumes your logo is at `public/logo-for-qr.png`
    const logoPath = path.join(process.cwd(), 'public', 'logo-for-qr.png');
    logoBufferCache = await fs.readFile(logoPath);
    return logoBufferCache;
  } catch (error) {
    console.error("Failed to read logo file:", error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const type = request.nextUrl.searchParams.get('type') || 'logo'; // Default to 'logo'

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // 1. Define the URL to encode in the QR code
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${username}`;

    // 2. Generate the base QR code as a buffer
    const qrCodeBuffer = await QRCode.toBuffer(profileUrl, {
      errorCorrectionLevel: 'H', // High correction for better readability with a logo
      margin: QR_CODE_MARGIN,
      width: QR_CODE_SIZE,
      color: {
        dark: '#000000FF',
        light: '#FFFFFFFF',
      },
    });

    // 3. Select and fetch the overlay image (logo or avatar)
    let overlayBuffer: Buffer | null = null;
    if (type === 'avatar') {
      const avatarUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/avatars/${username}`;
      overlayBuffer = await getImageBuffer(avatarUrl);
    } else {
      // Default to logo
      overlayBuffer = await getLogoBuffer();
    }

    // If there's no overlay, just return the plain QR code
    if (!overlayBuffer) {
      const headers = new Headers();
      headers.set('Content-Type', 'image/png');
      headers.set('Cache-Control', 'public, max-age=86400, immutable'); // Cache for 1 day
      return new NextResponse(qrCodeBuffer, { status: 200, headers });
    }

    // 4. Composite the overlay image onto the QR code using Sharp
    const overlaySize = Math.floor(QR_CODE_SIZE * LOGO_SIZE_RATIO);
    
    // Create a circular mask for the avatar if needed
    const roundedOverlay = await sharp(overlayBuffer)
        .resize(overlaySize, overlaySize, { fit: 'cover' })
        .composite([{
            input: Buffer.from(`<svg><circle cx="${overlaySize / 2}" cy="${overlaySize / 2}" r="${overlaySize / 2}"/></svg>`),
            blend: 'dest-in'
        }])
        .png()
        .toBuffer();
    
    const finalImageBuffer = await sharp(qrCodeBuffer)
      .composite([
        {
          input: roundedOverlay,
          gravity: 'center',
        },
      ])
      .png()
      .toBuffer();

    // 5. Create the response with the correct headers
    const headers = new Headers();
    headers.set('Content-Type', 'image/png');
    // Set a long cache time as the QR code (and usually avatar) won't change often
    headers.set('Cache-Control', 'public, max-age=86400, immutable'); // Cache for 1 day

    return new NextResponse(finalImageBuffer, { status: 200, headers });

  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json({ error: 'Internal server error while generating QR code' }, { status: 500 });
  }
}