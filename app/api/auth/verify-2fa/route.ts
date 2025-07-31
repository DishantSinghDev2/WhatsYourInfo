// app/api/auth/verify-2fa/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { authenticator } from 'otplib';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { generateToken } from '@/lib/auth'; // Your real token generator
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { code, preAuthToken } = await request.json();

    // 1. Verify the temporary pre-auth token
    let decoded;
    try {
      decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET!) as { userId: string, type: string };
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

    // 3. Verify the TOTP code
    const isValid = authenticator.check(code, user.twoFactorSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid authentication code.' }, { status: 400 });
    }
// --- Session Creation Logic (Almost identical) ---
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
    is2FAVerified: true, // This session WAS verified with 2FA
});

// Issue the final JWT, including the session token
const token = generateToken({ userId: user._id, emailVerified: user.emailVerified, sessionId: sessionToken });
const response = NextResponse.json({ message: 'Verification successful.' });
    response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
    });
    
    // 5. Create a new entry in the `sessions` collection
    // ... logic to create session document with ipAddress, userAgent, etc.

    return response;

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}