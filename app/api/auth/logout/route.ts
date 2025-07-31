import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // ✅ Correctly invalidate the cookie (important: path=/)
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: true,
      path: '/',
      expires: new Date(0), // Expire instantly
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
