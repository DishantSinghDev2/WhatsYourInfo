import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  email: z.string().email('Valid email is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = verifyOtpSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Find user with valid OTP
    const user = await db.collection('users').findOne({
      email,
      loginOtp: otp,
      loginOtpExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Clear OTP
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $unset: {
          loginOtp: 1,
          loginOtpExpires: 1
        },
        $set: {
          updatedAt: new Date(),
          emailVerified: true
        }
      }
    );

    // Generate JWT token
    const token = generateToken({ userId: user._id.toString() });

    // Create response with user data
    const response = NextResponse.json(
      {
        message: 'OTP verified successfully',
        user: {
          _id: user._id.toString(),
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isProUser: user.isProUser,
        }
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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

    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}