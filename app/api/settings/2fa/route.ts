// app/api/settings/2fa/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { z } from 'zod'; // --- (1) IMPORT ZOD ---

// --- POST: Start the 2FA setup process (This is already secure as it uses no user input) ---
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user || user.twoFactorEnabled) {
      return NextResponse.json({ error: 'Unauthorized or 2FA already enabled.' }, { status: 400 });
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'WhatsYour.Info', secret);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { twoFactorSecret: secret } }
    );

    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    return NextResponse.json({ secret, qrCodeDataUrl });
  } catch (error) {
    console.error("2FA Setup POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- (2) DEFINE SCHEMAS FOR PUT AND DELETE ---
const verifySchema = z.object({
  token: z.string().trim().length(6, { message: "Token must be 6 digits" }),
});

const disableSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});


// --- PUT: Verify the code and activate 2FA ---
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user || user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Setup process not started or 2FA already active.' }, { status: 400 });
    }

    const body = await request.json();
    // --- (3) VALIDATE AND SANITIZE THE TOKEN ---
    const { token } = verifySchema.parse(body);
    const sanitizedToken = token.replace(/\D/g, ''); // Remove any non-digit characters

    const isValid = authenticator.check(sanitizedToken, user.twoFactorSecret);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid authentication code.' }, { status: 400 });
    }

    const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(8).toString('hex'));
    const hashedRecoveryCodes = await Promise.all(recoveryCodes.map(code => bcrypt.hash(code, 10)));

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: {
          twoFactorEnabled: true,
          recoveryCodes: hashedRecoveryCodes,
      }}
    );

    return NextResponse.json({ recoveryCodes });
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("2FA Setup PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- DELETE: Disable 2FA ---
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is not enabled.' }, { status: 400 });
    }

    const body = await request.json();
    // --- (4) VALIDATE THE PASSWORD ---
    const { password } = disableSchema.parse(body);
    // Note: We do not sanitize the password itself, as any character can be valid.
    // The validation ensures it's a non-empty string.

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const fullUser = await db.collection('users').findOne({ _id: new ObjectId(user._id) });
    if (!fullUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const isPasswordCorrect = await bcrypt.compare(password, fullUser.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: { twoFactorEnabled: false },
        $unset: { twoFactorSecret: 1, recoveryCodes: 1 }
      }
    );

    return NextResponse.json({ message: 'Two-factor authentication has been disabled.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("2FA Setup DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}