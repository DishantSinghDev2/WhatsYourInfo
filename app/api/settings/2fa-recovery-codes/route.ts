// app/api/settings/2fa-recovery-codes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
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

    // Verify password to authorize viewing codes
    const isPasswordCorrect = await bcrypt.compare(password, fullUser.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
    }

    // --- IMPORTANT ---
    // You must decide if you store plain-text codes temporarily or decrypt them.
    // For this example, we assume they are stored hashed and CANNOT be shown again.
    // The *correct* flow is to GENERATE NEW codes.
    
    // 1. Generate NEW one-time recovery codes
    const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(8).toString('hex'));
    // 2. Hash them for secure storage, replacing the old ones
    const hashedRecoveryCodes = await Promise.all(recoveryCodes.map(code => bcrypt.hash(code, 10)));

    await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        { $set: { recoveryCodes: hashedRecoveryCodes } }
    );

    // Return the new plain-text codes to the user ONCE.
    return NextResponse.json({ recoveryCodes });

  } catch (error) {
    console.error("Fetch recovery codes error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}