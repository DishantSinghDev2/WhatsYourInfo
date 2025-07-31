// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthInEdge } from './lib/edge-auth';


export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // --- 1. Handle Special Rewrites First ---

  // Rewrite for username.card URLs to the correct page directory
  const cardMatch = pathname.match(/^\/([\w-]+)\.card$/);
  if (cardMatch) {
    const username = cardMatch[1];
    url.pathname = `/card/${username}`;
    return NextResponse.rewrite(url);
  }
  
  // --- 2. Determine Authentication State ---
  
  const decodedToken = await verifyAuthInEdge(request);

  const isLoggedIn = !!decodedToken?.userId;
  const isEmailVerified = decodedToken?.emailVerified === true;
  // This new flag is set in the JWT only after the 2FA code is successfully verified.
  const is2FAPassed = decodedToken?.tfa_passed === true;

  // --- 3. Define Public and Protected Routes ---

  // All pages are protected by default unless they are in this list.
  const publicPages = [
    '/', '/login', '/register', '/pricing', '/docs',
    '/tools', '/delete', '/verify-email', '/verify-otp', '/verify-2fa',
    '/terms', '/privacy', '/contact', '/blog', '/go', '/oauth'
  ];

  const isPublicPage = publicPages.some(p => pathname === p || (p !== '/' && pathname.startsWith(`${p}/`)));

  // Prevent API routes and static assets from being processed by the logic below.
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || /\.\w+$/.test(pathname)) {
    return NextResponse.next();
  }

  // --- 4. Implement Redirect Logic ---

  // A. User is fully logged in (and has passed 2FA if enabled)
  if (isLoggedIn && isEmailVerified && is2FAPassed) {
    // Redirect away from pages they shouldn't see when logged in.
    if (['/', '/login', '/register', '/verify-otp', '/verify-2fa'].includes(pathname)) {
      url.pathname = '/profile'; // Send them to the main dashboard
      return NextResponse.redirect(url);
    }
    // Otherwise, allow access to all other pages.
    return NextResponse.next();
  }

  // B. User has entered password but needs to complete 2FA
  if (isLoggedIn && !is2FAPassed) {
    // Allow access ONLY to the 2FA verification page.
    if (pathname === '/verify-2fa') {
      return NextResponse.next();
    }
    // For all other pages, force them to the 2FA page.
    url.pathname = '/verify-2fa';
    if (decodedToken?.preAuthToken) { // Pass the pre-auth token if it exists
        url.searchParams.set('token', decodedToken.preAuthToken);
    }
    return NextResponse.redirect(url);
  }
  
  // C. User is logged in but has not verified their email
  if (isLoggedIn && !isEmailVerified) {
    // Allow access ONLY to the email verification page.
    if (pathname === '/verify-otp' || pathname === '/verify-email') {
      return NextResponse.next();
    }
    // For all other pages, force them to verify their email.
    url.pathname = '/verify-otp'; // or '/verify-email' depending on your flow
    return NextResponse.redirect(url);
  }

  // D. User is not logged in
  if (!isLoggedIn && !isPublicPage) {
    // Redirect any unauthenticated access to a protected page to the login screen.
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname); // Remember where they were trying to go
    return NextResponse.redirect(url);
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