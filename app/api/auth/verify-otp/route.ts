import { NextRequest, NextResponse } from 'next/server';
import { generateToken, getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// --- (2) STRENGTHEN THE ZOD SCHEMA ---
// Add .trim() to both fields to handle extraneous whitespace
const verifyOtpSchema = z.object({
  otp: z.string().trim().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {

    const userFromToken = await getUserFromToken(request);
    if (!userFromToken || !userFromToken._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = verifyOtpSchema.parse(body);

    // --- (3) SANITIZE THE INPUTS ---
    // Sanitize the email with DOMPurify
    const sanitizedEmail = DOMPurify.sanitize(userFromToken.email);

    // Sanitize the OTP by removing any non-digit characters.
    // This ensures only a clean numeric string is used for the query.
    const sanitizedOtp = validatedData.otp.replace(/\D/g, '');


    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (4) USE SANITIZED DATA FOR THE DATABASE QUERY ---
    // Find user with a valid OTP using the cleaned inputs
    const user = await db.collection('users').findOne({
      email: sanitizedEmail,
      loginOtp: sanitizedOtp,
      loginOtpExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Clear OTP (Unchanged)
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $unset: {
          loginOtp: 1,
          loginOtpExpires: 1
        },
        $set: {
          updatedAt: new Date(),
          emailVerified: true // Also mark email as verified on successful OTP login
        }
      }
    );

    // Generate JWT token (Unchanged)
    const token = generateToken({
      userId: user._id,
      emailVerified: true,
      tfa_enabled: user.twoFactorEnabled,
      sessionId: userFromToken.sessionId,
    });

    // Create response with user data (Unchanged)
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

    // Set HTTP-only cookie (Unchanged)
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

    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}