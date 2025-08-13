import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache';
import { dispatchWebhookEvent } from '@/lib/webhooks';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// --- (2) STRENGTHEN THE ZOD SCHEMA (added .trim()) ---
const profileDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name cannot be empty."),
  lastName: z.string().trim().min(1, "Last name cannot be empty."),
  bio: z.string().trim().max(1000, "Bio cannot exceed 1000 characters.").optional(),
  businessName: z.string().trim().max(100, "Business name cannot exceed 100 characters.").optional(),
});

export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = profileDetailsSchema.parse(body);

    // --- (3) SANITIZE ALL USER-PROVIDED STRINGS ---
    // Create a new, clean object for storage.
    const sanitizedData = {
      firstName: DOMPurify.sanitize(validatedData.firstName),
      lastName: DOMPurify.sanitize(validatedData.lastName),
      bio: validatedData.bio ? DOMPurify.sanitize(validatedData.bio) : undefined,
      businessName: validatedData.businessName ? DOMPurify.sanitize(validatedData.businessName) : undefined,
    };

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (4) UPDATE THE DATABASE WITH THE SANITIZED DATA ---
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { ...sanitizedData, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      // It's better to return a 200 OK even if nothing changed, as the state is still correct.
      return NextResponse.json({ message: 'No changes detected.' });
    }

    await cacheDel(`user:profile:${user.username}`);

    // Dispatch a webhook event
    await dispatchWebhookEvent('profile.updated', new ObjectId(user._id), {
      updatedFields: Object.keys(validatedData),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Profile updated successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Profile details update error:', error);
    return NextResponse.json({ error: 'Failed to update profile details' }, { status: 500 });
  }
}