// app/api/auth/verify-2fa/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { authenticator } from 'otplib';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { generateToken } from '@/lib/auth';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

export async function POST(request: NextRequest) {
  try {
    // Note: The `getUserFromToken` check might be redundant here since we are verifying a pre-auth token,
    // which serves a similar purpose. However, keeping it adds another layer of defense.
    // const userFromToken = await getUserFromToken(request);
    // if (!userFromToken || !userFromToken._id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { code, preAuthToken } = await request.json();

    // --- (2) VALIDATE AND SANITIZE INPUTS ---
    if (!code || typeof code !== 'string' || !preAuthToken || typeof preAuthToken !== 'string') {
      return NextResponse.json({ error: 'Invalid input provided.' }, { status: 400 });
    }

    // Sanitize the JWT string to be safe.
    const sanitizedPreAuthToken = DOMPurify.sanitize(preAuthToken);

    // Sanitize the 2FA code by stripping any non-digit characters.
    // This ensures that only a clean numeric string is passed to the authenticator library.
    const sanitizedCode = code.replace(/\D/g, '');


    // 1. Verify the temporary pre-auth token using the sanitized version
    let decoded;
    try {
      decoded = jwt.verify(sanitizedPreAuthToken, process.env.JWT_SECRET!) as { userId: string, type: string };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired session. Please log in again.' }, { status: 401 });
    }
    if (decoded.type !== 'pre-auth') {
      return NextResponse.json({ error: 'Invalid token type.' }, { status: 401 });
    }

    // 2. Fetch the user and their 2FA secret
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'User not found or 2FA not enabled.' }, { status: 401 });
    }

    // 3. Verify the TOTP code using the sanitized version
    const isValid = authenticator.check(sanitizedCode, user.twoFactorSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid authentication code.' }, { status: 400 });
    }

    // --- Session Creation Logic (Unchanged) ---
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    const parsedUA = new UAParser(userAgent).getResult();
    const device = `${parsedUA.browser.name} on ${parsedUA.os.name}`;

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const hashedSessionToken = crypto.createHash('sha256').update(sessionToken).digest('hex');

    await db.collection('sessions').insertOne({
      userId: user._id,
      token: hashedSessionToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastUsedAt: new Date(),
      ipAddress,
      userAgent: device,
      is2FAVerified: true,
    });

    const token = generateToken({
      userId: user._id,
      emailVerified: user.emailVerified,
      sessionId: sessionToken,
      tfa_passed: true
    });

    const response = NextResponse.json({ message: 'Verification successful.' });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('2FA Verification Error:', error); // Log the actual error for debugging
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}