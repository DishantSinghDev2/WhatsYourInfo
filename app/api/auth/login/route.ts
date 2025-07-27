import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id, emailVerified: user.emailVerified });

    // Create response with user data
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isProUser: user.isProUser,
          emailVerified: user.emailVerified,
        }
      },
      { status: 200 }
    );

    if (!user.emailVerified) {
      const response = await fetch(`${process.env.FRONTEND_URL || `localhost:3000`}/api/auth/send-otp`, {
        method: "POST",
        body: JSON.stringify({
          email: user.email
        })
      })
      if (!response.ok){
        throw new Error("Failed to send OTP")
      }
    }

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}