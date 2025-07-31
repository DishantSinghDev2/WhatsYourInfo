import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { z } from 'zod';
import clientPromise from '@/lib/mongodb'; // Import clientPromise
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

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

    // --- NEW: 2FA Check ---
    if (user.twoFactorEnabled) {
      // User has 2FA enabled. Do NOT issue the final auth cookie.
      // Instead, issue a short-lived "pre-auth" JWT.
      const preAuthToken = jwt.sign(
        { userId: user._id, type: 'pre-auth' },
        process.env.JWT_SECRET!,
        { expiresIn: '10m' }
      );

      // Send this temporary token to the frontend.
      return NextResponse.json({ twoFactorRequired: true, preAuthToken });
    }



    let recovered = false

    // --- NEW: RECOVERY LOGIC ---
    if (user.deactivatedAt) {
      // This is a recovery attempt. Reactivate the account.
      const client = await clientPromise;
      const db = client.db('whatsyourinfo');
      await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        { $unset: { deactivatedAt: 1 } } // Remove the deactivation flag
      );

      recovered = true
    }

    // --- Session Creation Logic ---
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    const parsedUA = new UAParser(userAgent).getResult();
    const device = `${parsedUA.browser.name} on ${parsedUA.os.name}`;

    // This session identifier will be stored in the cookie/JWT
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const hashedSessionToken = crypto.createHash('sha256').update(sessionToken).digest('hex');

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    await db.collection('sessions').insertOne({
      userId: user._id,
      token: hashedSessionToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
      lastUsedAt: new Date(),
      ipAddress,
      userAgent: device,
      is2FAVerified: false, // This session was not verified with 2FA
    });

    // Issue the final JWT, now including the session token
    const token = generateToken({ userId: user._id, emailVerified: user.emailVerified, sessionId: sessionToken, tfa_passed: true });

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
        },
        recovered
      },
      { status: 200 }
    );

    if (!user.emailVerified) {
      await fetch(`${process.env.FRONTEND_URL || `localhost:3000`}/api/auth/send-otp`, {
        method: "POST",
        body: JSON.stringify({
          email: user.email
        })
      })
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