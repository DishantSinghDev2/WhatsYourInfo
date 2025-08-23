import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---
import { generateAndSendOtp } from '@/lib/otp';

// --- (2) STRENGTHEN THE ZOD SCHEMA ---
// Add .trim() to automatically remove leading/trailing whitespace.
const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // Password is not empty
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- (3) VALIDATE THE INPUT ---
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // --- (4) SANITIZE THE EMAIL INPUT ---
    // Clean the email address to remove any potentially malicious characters
    // before using it to query the database via authenticateUser.
    const sanitizedEmail = DOMPurify.sanitize(email);

    // --- (5) AUTHENTICATE USING THE SANITIZED EMAIL ---
    const user = await authenticateUser(sanitizedEmail, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // --- NEW: 2FA Check (Unchanged) ---
    if (user.twoFactorEnabled) {
      const preAuthToken = jwt.sign(
        { userId: user._id, type: 'pre-auth' },
        process.env.JWT_SECRET!,
        { expiresIn: '10m' }
      );
      return NextResponse.json({ twoFactorRequired: true, preAuthToken });
    }

    let recovered = false;

    // --- NEW: RECOVERY LOGIC (Unchanged) ---
    if (user.deactivatedAt) {
      const client = await clientPromise;
      const db = client.db('whatsyourinfo');
      await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        { $unset: { deactivatedAt: 1 } }
      );
      recovered = true;
    }

    // --- Session Creation Logic (Unchanged) ---
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    const parsedUA = new UAParser(userAgent).getResult();
    const device = `${parsedUA.browser.name} on ${parsedUA.os.name}`;

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
      is2FAVerified: false,
    });

    const token = generateToken({
      userId: user._id,
      emailVerified: user.emailVerified,
      sessionId: sessionToken,
      tfa_enabled: user.twoFactorEnabled,
      ...(user.twoFactorEnabled ? { tfa_passed: true } : {}),
    });

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
      // Call the logic directly instead of using fetch
      await generateAndSendOtp(new ObjectId(user._id), user.email, user.username);
    }

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