// File: /app/api/profile/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache';
import { z } from 'zod'; // --- (1) IMPORT ZOD ---

// --- (2) DEFINE A STRICT SCHEMA FOR THE INPUT ---
// This ensures the input can ONLY be 'public' or 'private'.
const visibilitySchema = z.object({
  profileVisibility: z.enum(['public', 'private']),
});


export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // --- (3) VALIDATE THE INPUT AGAINST THE SCHEMA ---
    // If the body is malformed or profileVisibility is not 'public' or 'private', this will throw an error.
    const { profileVisibility } = visibilitySchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo'); // Explicitly name your database
    const users = db.collection('users');

    // --- (4) PERFORM A SAFE AND CORRECT UPDATE ---
    const result = await users.updateOne(
      { _id: new ObjectId(user._id) },
      // Use the validated and safe profileVisibility variable
      { $set: { profileVisibility: profileVisibility } }
      // Removed { upsert: true } as it's incorrect for an update operation
    );

    // --- (5) CORRECTLY CHECK THE RESULT ---
    // The correct check is for matchedCount. If no user was found, it's an error.
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // This is a success whether modifiedCount is 1 or 0 (value was already set).
    await cacheDel(`user:profile:${user.username}`);

    return NextResponse.json({
      message: 'Profile visibility updated successfully.',
      visibility: profileVisibility
    }, { status: 200 });

  } catch (error) {
    // --- (6) ADD PROPER ERROR HANDLING ---
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Profile visibility update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}