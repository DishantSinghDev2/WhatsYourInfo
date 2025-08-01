// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthInEdge } from './lib/edge-auth';


export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const { pathname, searchParams } = url;

  // --- 1. Handle Special Rewrites First ---

  // Rewrite for username.card URLs to the correct page directory
  const cardMatch = pathname.match(/^\/([\w-]+)\.card$/);
  if (cardMatch) {
    const username = cardMatch[1];
    url.pathname = `/card/${username}`;
    return NextResponse.rewrite(url);
  }

  // Prevent API routes and static assets from being processed by the logic below.
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || /\.\w+$/.test(pathname)) {
    return NextResponse.next();
  }
  
  // --- FIX: Explicitly add /oauth/authorize to the public routes ---
  const publicRoutes = [
    '/', '/login', '/register', '/pricing', '/contact',
    '/verify-email', '/verify-otp', '/verify-2fa',
    '/terms', '/privacy', '/blog', '/docs', '/tools', '/go', 
    '/oauth', '/oauth/authorize' // <-- Add this route
  ];

  const isPublic = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  const decodedToken = await verifyAuthInEdge(request);
  console.log(decodedToken)
  const isLoggedIn = !!decodedToken?.userId;
  const isEmailVerified = decodedToken?.emailVerified === true;
  const is2FAPassed = decodedToken?.tfa_passed === true;

  // Not logged in → redirect to /login
  if (!isLoggedIn && !isPublic) {
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Logged in but email not verified → force verify
  if (isLoggedIn && !isEmailVerified && pathname !== '/verify-otp') {
    url.pathname = '/verify-otp';
    return NextResponse.redirect(url);
  }

  // Logged in but 2FA not passed → force 2FA
  if (isLoggedIn && !is2FAPassed && pathname !== '/verify-2fa') {
    url.pathname = '/verify-2fa';
    if (decodedToken?.preAuthToken) {
      url.searchParams.set('token', decodedToken.preAuthToken);
    }
    return NextResponse.redirect(url);
  }

  // Logged in, verified, passed 2FA
  if (isLoggedIn && isEmailVerified && is2FAPassed) {
    // If user is on a public route like /login or /register, redirect to /profile
    if (['/login', '/register', '/', '/verify-otp', '/verify-2fa'].includes(pathname)) {
      const callback = searchParams.get('callbackUrl');
      if (callback && callback.startsWith('/')) {
        return NextResponse.redirect(new URL(callback, request.url));
      }

      url.pathname = callback || '/profile';
      return NextResponse.redirect(url);
    }
  }


  // --- 5. Handle Subdomain Routing (if not handled by redirects) ---

  if (hostname.includes('.whatsyour.info') && !hostname.startsWith('www.')) {
    const subdomain = hostname.split('.')[0];
    url.pathname = `/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // --- 6. Apply Security Headers (as a final step) ---
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;"
  );

  return response;
}

// The matcher remains the same, it's well-configured.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml|json)).*)',
  ],
};