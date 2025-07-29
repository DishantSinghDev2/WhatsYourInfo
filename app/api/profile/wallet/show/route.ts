import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const wallet = z.object({
    showWalletOnPublic: z.boolean().default(true),
});

// We only need PUT since we will replace the whole array each time for simplicity
export async function PUT(request: NextRequest) {
    const user = await getUserFromToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized or Pro subscription required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const validatedWallet = wallet.parse(body);

        // Sanitize data before saving

        const client = await clientPromise;
        const db = client.db('whatsyourinfo');

        await db.collection('users').updateOne(
            { _id: new ObjectId(user._id) },
            { $set: { showWalletOnPublic: validatedWallet.showWalletOnPublic, updatedAt: new Date() } }
        );

        return NextResponse.json({ message: 'Wallet visibility updated successfully.' });
    } catch (error) {
        console.error('Wallet update error:', error);
        return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
    }
}