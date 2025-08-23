import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthInEdge } from './lib/edge-auth';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const { pathname, searchParams } = url;

  // --- 1. Rewrite .card URLs (Unchanged) ---
  const cardMatch = pathname.match(/^\/([\w-]+)\.card$/);
  if (cardMatch) {
    const username = cardMatch[1];
    url.pathname = `/card/${username}`;
    return NextResponse.rewrite(url);
  }

  // --- 2. Skip non-page requests (Unchanged) ---
  const isStaticOrApi =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/oauth/') ||
    /\.\w+$/.test(pathname);
  if (isStaticOrApi) return NextResponse.next();

  // --- 3. Public routes (UPDATED) ---
  // Simplified because `/login` and `/register` now cover their sub-routes.
  const publicRoutes = [
    '/', '/login', '/register', '/pricing', '/contact',
    '/terms', '/privacy', '/blog', '/docs', '/tools', '/go', '/deleted', '/qr', '/logout'
  ];

  // The `startsWith` check correctly handles paths like `/login/2fa` and `/login/verify-otp`
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // --- 3.1: Allow public user profile paths (Unchanged) ---
  const isRootLevelUsername = /^\/[\w-]+$/.test(pathname) && !isPublicRoute;
  if (isRootLevelUsername) {
    return NextResponse.next();
  }

  // --- 4. Auth Verification (Unchanged) ---
  const decodedToken = await verifyAuthInEdge(request);
  const isLoggedIn = !!decodedToken?.userId;
  const isEmailVerified = decodedToken?.emailVerified === true || false;
  const isTFAEnabled = decodedToken?.tfa_enabled === true || false;
  const isTFAPassed = decodedToken?.tfa_passed === true || false;

  // --- 5. Unauthenticated & Private Route → Redirect to Login (Unchanged) ---
  if (!isLoggedIn && !isPublicRoute) {
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // --- 6. Logged in but Email Not Verified (UPDATED) ---
  // Redirects to the new OTP path and checks against it to prevent a redirect loop.
  if (isLoggedIn && !isEmailVerified && pathname !== '/login/verify-otp') {
    url.pathname = '/login/verify-otp'; // <-- Changed path
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // --- 7. Logged in, TFA Enabled, But Not Passed (UPDATED) ---
  // Redirects to the new 2FA path and checks against it.
  if (isLoggedIn && isEmailVerified && isTFAEnabled && !isTFAPassed && pathname !== '/login/2fa') {
    url.pathname = '/login/2fa'; // <-- Changed path

    if (decodedToken?.preAuthToken) {
      url.searchParams.set('token', decodedToken.preAuthToken);
    }

    // Preserve the original callbackUrl if it exists
    const callback = searchParams.get('callbackUrl') || pathname;
    if (callback && callback.startsWith('/')) {
      url.searchParams.set('callbackUrl', callback);
    }

    return NextResponse.redirect(url);
  }

  // --- 8. User fully authenticated, but visiting auth routes (UPDATED) ---
  // Now checks if the path starts with `/login` or `/register`.
  const authFlowRoutes = ['/login', '/register'];
  if (
    isLoggedIn &&
    isEmailVerified &&
    (!isTFAEnabled || isTFAPassed) &&
    (pathname === '/' || authFlowRoutes.some(p => pathname.startsWith(p)))
  ) {
    const callback = searchParams.get('callbackUrl');
    url.pathname = callback && callback.startsWith('/') ? callback : '/profile';
    url.search = ''; // Clear search params on redirect to profile
    return NextResponse.redirect(url);
  }

  // --- Subdomain and Security Headers (Unchanged) ---
  if (hostname.endsWith('.whatsyour.info') && !hostname.startsWith('www.')) {
    const subdomain = hostname.split('.')[0];
    const newPath = `/${subdomain}${url.pathname}`;
    url.pathname = newPath;
    return NextResponse.rewrite(url);
  }

  const nonce = crypto.randomUUID();
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://www.google-analytics.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://www.google-analytics.com https://checkout.razorpay.com https://lumberjack.razorpay.com;
    frame-src https://checkout.razorpay.com https://api.razorpay.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('x-nonce', nonce);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return res;
}

// --- Matcher remains unchanged ---
export const config = {
  matcher: [
    '/((?!api|oauth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml|json)).*)',
  ],
};