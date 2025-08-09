import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  // Vercel provides this header automatically. For local dev, it will be null.
  const country = request.headers.get('x-vercel-ip-country');
  
  return NextResponse.json({ country: country || 'US' }); // Default to 'US' for local dev
}