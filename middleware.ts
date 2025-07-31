import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function verifyToken(token: string): any {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (decoded.exp && Date.now() / 1000 > decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // ✅ .card username rewrite
  const cardMatch = pathname.match(/^\/([\w-]+)\.card$/);
  if (cardMatch) {
    const username = cardMatch[1];
    url.pathname = `/card/${username}`;
    return NextResponse.rewrite(url);
  }

  const token = request.cookies.get('auth-token')?.value;
  const decoded = token ? verifyToken(token) : null;

  const isLoggedIn = !!(decoded && decoded.userId);
  const isEmailVerified = decoded?.emailVerified === true;

  const publicPrefixes = [
    '/', '/pricing', '/docs', '/blog', '/contact', '/tools', 
    '/terms', '/privacy', '/status', '/help', '/login', '/register'
  ];
  const isPublicPage = publicPrefixes.some(p => pathname === p || pathname.startsWith(`${p}/`));

  // 🔒 Redirect unauthenticated users away from protected pages
  if (!isLoggedIn && !isPublicPage && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 🛑 Require email verification
  if (
    isLoggedIn &&
    !isEmailVerified &&
    pathname !== '/verify-otp' &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api')
  ) {
    url.pathname = '/verify-otp';
    return NextResponse.redirect(url);
  }

  // ✅ Already verified but visiting /verify-otp
  if (isLoggedIn && isEmailVerified && pathname === '/verify-otp') {
    url.pathname = '/profile';
    return NextResponse.redirect(url);
  }

  // 🔁 Authenticated user visiting login/register/home
  if (isLoggedIn && ['/login', '/register', '/'].includes(pathname)) {
    url.pathname = '/profile';
    return NextResponse.redirect(url);
  }

  // 🌐 Subdomain → path routing
  if (hostname.includes('.whatsyour.info') && !hostname.startsWith('www.')) {
    const subdomain = hostname.split('.')[0];
    const isPublicAsset = pathname.startsWith('/api/')
      || pathname.startsWith('/_next/')
      || pathname.startsWith('/favicon')
      || /\.\w+$/.test(pathname);

    if (!isPublicAsset) {
      url.pathname = `/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  // 🛡️ Security headers
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

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml|json)).*)',
  ],
};
