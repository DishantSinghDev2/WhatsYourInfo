import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache';

const walletAddressSchema = z.object({
  paymentType: z.string().min(1, "Payment type is required"),
  address: z.string().min(1, "Address/username is required"),
});

// We only need PUT since we will replace the whole array each time for simplicity
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized or Pro subscription required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validatedAddresses = z.array(walletAddressSchema).parse(body.wallet);

    // Sanitize data before saving
    const walletData = validatedAddresses.map(addr => ({
      _id: new ObjectId(),
      paymentType: addr.paymentType,
      address: addr.address,
    }));

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { wallet: walletData, updatedAt: new Date() } }
    );

    await cacheDel(`user:profile:${user.username}`);


    return NextResponse.json({ message: 'Wallet updated successfully.' });
  } catch (error) {
    console.error('Wallet update error:', error);
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }
}