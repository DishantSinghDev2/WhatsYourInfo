import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthInEdge } from './lib/edge-auth';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const { pathname, searchParams } = url;

  // --- 1. Rewrite .card URLs to /card/:username ---
  const cardMatch = pathname.match(/^\/([\w-]+)\.card$/);
  if (cardMatch) {
    const username = cardMatch[1];
    url.pathname = `/card/${username}`;
    return NextResponse.rewrite(url);
  }

  // --- 2. Skip non-page requests ---
  const isStaticOrApi =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/oauth/') ||
    /\.\w+$/.test(pathname);
  if (isStaticOrApi) return NextResponse.next();

  // --- 3. Public routes (allow without login) ---
  const publicRoutes = [
    '/', '/login', '/register', '/pricing', '/contact',
    '/verify-email', '/verify-otp', '/verify-2fa',
    '/terms', '/privacy', '/blog', '/docs', '/tools', '/go', '/deleted', '/qr'
  ];

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  // --- 3.1: Allow public user profile paths like /dishant ---
  const isRootLevelUsername = /^\/[\w-]+$/.test(pathname) && !isPublicRoute;

  if (isRootLevelUsername) {
    return NextResponse.next(); // Allow access to public profiles without auth
  }


  // --- 4. Auth Verification ---
  const decodedToken = await verifyAuthInEdge(request);
  const isLoggedIn = !!decodedToken?.userId;
  const isEmailVerified = decodedToken?.emailVerified === true;
  const isTFAEnabled = decodedToken?.tfa_enabled === true;
  const isTFAPassed = decodedToken?.tfa_passed === true;

  // --- 5. Unauthenticated & Private Route → Redirect to Login ---
  if (!isLoggedIn && !isPublicRoute) {
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // --- 6. Logged in but Email Not Verified ---
  if (isLoggedIn && !isEmailVerified && pathname !== '/verify-otp') {
    url.pathname = '/verify-otp';
    return NextResponse.redirect(url);
  }

  // --- 7. Logged in, TFA Enabled, But Not Passed ---
  if (isLoggedIn && isEmailVerified && isTFAEnabled && !isTFAPassed && pathname !== '/verify-2fa') {
    url.pathname = '/verify-2fa';

    if (decodedToken?.preAuthToken) {
      url.searchParams.set('token', decodedToken.preAuthToken);
    }

    const callback = searchParams.get('callbackUrl');
    if (callback && callback.startsWith('/')) {
      url.searchParams.set('callbackUrl', callback);
    }

    return NextResponse.redirect(url);
  }

  // --- 8. User fully authenticated, but visiting public route like /login ---
  if (
    isLoggedIn &&
    isEmailVerified &&
    (!isTFAEnabled || isTFAPassed) &&
    ['/login', '/register', '/', '/verify-otp', '/verify-2fa'].includes(pathname)
  ) {
    const callback = searchParams.get('callbackUrl');
    url.pathname = callback && callback.startsWith('/') ? callback : '/profile';
    return NextResponse.redirect(url);
  }

  if (hostname.endsWith('.whatsyour.info') && !hostname.startsWith('www.')) {
    const subdomain = hostname.split('.')[0]; // extract `username` from `username.whatsyour.info`
    
    // Rewriting to: /[username]/[original pathname]
    const newPath = `/${subdomain}${url.pathname}`;
    url.pathname = newPath;

    return NextResponse.rewrite(url);
  }

  const nonce = crypto.randomUUID();
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://www.google-analytics.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://www.google-analytics.com https://checkout.razorpay.com;
    frame-src https://checkout.razorpay.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', cspHeader);
  requestHeaders.set('x-nonce', nonce); // pass nonce to pages


  // --- 10. Security Headers ---
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', cspHeader);


  return response;
}

// --- Matcher remains unchanged ---
export const config = {
  matcher: [
    '/((?!api|oauth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml|json)).*)',
  ],
};
