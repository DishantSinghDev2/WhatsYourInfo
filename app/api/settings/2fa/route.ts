// app/api/settings/2fa/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// --- POST: Start the 2FA setup process ---
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || user.twoFactorEnabled) {
    return NextResponse.json({ error: 'Unauthorized or 2FA already enabled.' }, { status: 400 });
  }

  // Generate a new TOTP secret for the user
  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri(user.email, 'WhatsYour.Info', secret);

  // Temporarily store the unverified secret on the user document
  const client = await clientPromise;
  const db = client.db('whatsyourinfo');
  await db.collection('users').updateOne(
    { _id: new ObjectId(user._id) },
    { $set: { twoFactorSecret: secret } } // Store it temporarily, unencrypted for now
  );

  // Generate a QR code data URI to be displayed on the frontend
  const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

  return NextResponse.json({ secret, qrCodeDataUrl });
}

// --- PUT: Verify the code and activate 2FA ---
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: 'Setup process not started or 2FA already active.' }, { status: 400 });
  }

  const { token } = await request.json();
  // Verify the token the user entered
  const isValid = authenticator.check(token, user.twoFactorSecret);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid authentication code.' }, { status: 400 });
  }

  // --- Activation successful ---
  // 1. Generate one-time recovery codes
  const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(8).toString('hex'));
  // 2. Hash them for secure storage
  const hashedRecoveryCodes = await Promise.all(recoveryCodes.map(code => bcrypt.hash(code, 10)));

  // 3. Update the user document to finalize 2FA setup
  const client = await clientPromise;
  const db = client.db('whatsyourinfo');
  await db.collection('users').updateOne(
    { _id: new ObjectId(user._id) },
    { $set: { 
        twoFactorEnabled: true,
        // Optional: Encrypt the secret before permanent storage
        // twoFactorSecret: encrypt(user.twoFactorSecret), 
        recoveryCodes: hashedRecoveryCodes,
    }}
  );

  // Return the plain-text codes to the user ONCE.
  return NextResponse.json({ recoveryCodes });
}

// --- DELETE: Disable 2FA ---

export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user || !user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA is not enabled.' }, { status: 400 });
  }

  const { password } = await request.json();
  if (!password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');
  
  const fullUser = await db.collection('users').findOne({ _id: new ObjectId(user._id) });
  if (!fullUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  
  const isPasswordCorrect = await bcrypt.compare(password, fullUser.password);
  if (!isPasswordCorrect) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
  }

  // Password is correct, proceed with disabling 2FA
  await db.collection('users').updateOne(
    { _id: new ObjectId(user._id) },
    { 
      $set: { twoFactorEnabled: false }, 
      $unset: { twoFactorSecret: 1, recoveryCodes: 1 } 
    }
  );

  return NextResponse.json({ message: 'Two-factor authentication has been disabled.' });
}