// app/api/settings/2fa-recovery-codes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { z } from 'zod'; // --- (1) IMPORT ZOD ---

// --- (2) DEFINE A SCHEMA FOR THE REQUEST BODY ---
const regenerateSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is not enabled.' }, { status: 400 });
    }

    const body = await request.json();
    // --- (3) VALIDATE THE PASSWORD ---
    const { password } = regenerateSchema.parse(body);
    // Note: We do not sanitize the password as any character can be valid.
    // The validation ensures it's a non-empty string.

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    
    const fullUser = await db.collection('users').findOne({ _id: new ObjectId(user._id) });
    if (!fullUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const isPasswordCorrect = await bcrypt.compare(password, fullUser.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
    }

    // Your regeneration logic is already perfect and secure. No changes needed.
    const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(8).toString('hex'));
    const hashedRecoveryCodes = await Promise.all(recoveryCodes.map(code => bcrypt.hash(code, 10)));

    await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        { $set: { recoveryCodes: hashedRecoveryCodes } }
    );

    return NextResponse.json({ recoveryCodes });

  } catch (error) {
    // --- (4) ADD SPECIFIC ERROR HANDLING FOR ZOD ---
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Regenerate recovery codes error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}