// app/api/profile/wallet/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache'; // Assuming you have a cache invalidation utility

// --- (1) ZOD SCHEMA (Your schema is already excellent) ---
// It strictly enforces that showWalletOnPublic must be a boolean.
const walletVisibilitySchema = z.object({
    showWalletOnPublic: z.boolean(),
});

export async function PUT(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        if (!user) {
            // Changed to 401 for unauthorized, as is standard.
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        
        // --- (2) VALIDATE THE REQUEST BODY ---
        // This is the core security step. It ensures the data is in the exact shape we expect.
        const { showWalletOnPublic } = walletVisibilitySchema.parse(body);

        const client = await clientPromise;
        const db = client.db('whatsyourinfo');

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(user._id) },
            // Use the validated variable, which is guaranteed to be a boolean.
            { $set: { "settings.showWalletOnPublic": showWalletOnPublic, updatedAt: new Date() } }
        );
        
        // It's good practice to invalidate any cached versions of the user's profile
        if (result.modifiedCount > 0) {
            await cacheDel(`user:profile:${user.username}`);
        }

        return NextResponse.json({ message: 'Wallet visibility updated successfully.' });

    } catch (error) {
        // --- (3) ADD SPECIFIC ERROR HANDLING FOR ZOD ---
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        
        // Generic error for any other unexpected issues
        console.error('Wallet visibility update error:', error);
        return NextResponse.json({ error: 'Failed to update wallet visibility' }, { status: 500 });
    }
}