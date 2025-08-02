import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken, User } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { isValidEmail, isValidUsername } from '@/lib/utils';
import { z } from 'zod';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  profileVisibility: z.enum(['public', 'private']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);
    const { email, password, username, firstName, lastName, profileVisibility } = validatedData;

    // Additional validation
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const existingUser = await db.collection('users').findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({
      type: 'personal',
      profileVisibility,
      email,
      password,
      username,
      firstName,
      lastName,
    });

    // --- Session Creation Logic ---
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    const parsedUA = new UAParser(userAgent).getResult();
    const device = `${parsedUA.browser.name} on ${parsedUA.os.name}`;

    // This session identifier will be stored in the cookie/JWT
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const hashedSessionToken = crypto.createHash('sha256').update(sessionToken).digest('hex');

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
    const token = generateToken({
      userId: user._id,
      emailVerified: user.emailVerified,
      sessionId: sessionToken
    });

    if (!user.emailVerified) {
      await fetch(`${process.env.FRONTEND_URL || `localhost:3000`}/api/auth/send-otp`, {
        method: "POST",
        body: JSON.stringify({
          email: user.email
        })
      })
    }

    // Remove password from response
    const { ...userResponse } = user as User;

    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: { ...userResponse, password: null }
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}