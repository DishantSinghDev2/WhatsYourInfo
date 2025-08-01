// app/go/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    if (!slug) return NextResponse.redirect(new URL('/', request.url));

    const db = (await clientPromise).db('whatsyourinfo');
    const link = await db.collection('shortlinks').findOneAndUpdate(
      { slug },
      { $inc: { clickCount: 1 } } // Atomically increment the click count
    );
    
    if (link?.userId) {
      return NextResponse.redirect(new URL(link.destinationUrl));
    } else {
      return NextResponse.redirect(new URL('/404', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}