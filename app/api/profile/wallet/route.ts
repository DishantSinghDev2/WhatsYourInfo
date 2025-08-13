// app/api/profile/wallet/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// --- (2) STRENGTHEN THE ZOD SCHEMA ---
const walletAddressSchema = z.object({
  paymentType: z.string().trim().min(1, "Payment type is required"),
  address: z.string().trim().min(1, "Address/username is required"),
});

// We only need PUT since we will replace the whole array each time for simplicity
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      // Use 401 for unauthorized, it's more standard
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedAddresses = z.array(walletAddressSchema).parse(body.wallet);

    // --- (3) SANITIZE DATA BEFORE SAVING ---
    // Map over the validated array and sanitize each string field.
    const sanitizedWalletData = validatedAddresses.map(addr => ({
      _id: new ObjectId(),
      paymentType: DOMPurify.sanitize(addr.paymentType),
      address: DOMPurify.sanitize(addr.address),
    }));

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (4) STORE THE SANITIZED DATA ---
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      // Use the clean, sanitized array for the update.
      { $set: { wallet: sanitizedWalletData, updatedAt: new Date() } }
    );

    await cacheDel(`user:profile:${user.username}`);

    return NextResponse.json({ message: 'Wallet updated successfully.' });
  } catch (error) {
    // --- (5) ADD SPECIFIC ERROR HANDLING FOR ZOD ---
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Wallet update error:', error);
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }
}