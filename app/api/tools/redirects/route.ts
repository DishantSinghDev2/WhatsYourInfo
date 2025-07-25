import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);

  // Checks for paths like /[username]/[slug]
  if (segments.length === 2) {
    const [username, slug] = segments;

    // Avoid running this logic on dashboard routes etc.
    if (['profile', 'api', 'login', 'register'].includes(username)) {
      return NextResponse.next();
    }

    try {
      const client = await clientPromise;
      const db = client.db('whatsyourinfo');

      const user = await db.collection('users').findOne({ username });
      
      if (user && user.isProUser && user.redirects) {
        const redirect = user.redirects.find((r: any) => r.slug === slug);
        if (redirect) {
          return NextResponse.redirect(new URL(redirect.url));
        }
      }
    } catch (error) {
      console.error('Middleware redirect error:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};