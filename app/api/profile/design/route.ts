// app/api/profile/design/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// Zod schema remains the same for initial validation
const designSchema = z.object({
  theme: z.string().optional(),
  customColors: z.object({
    background: z.string(),
    surface: z.string(),
    accent: z.string(),
  }).optional(),
  headerImage: z.string().optional().or(z.literal('')),
  backgroundImage: z.string().optional().or(z.literal('')),
  backgroundBlur: z.number().min(0).max(20).optional(),
  backgroundOpacity: z.number().min(0).max(100).optional(),
  sections: z.array(z.string()),
  visibility: z.record(z.boolean()),
});

export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = designSchema.parse(body);

    // --- (2) CREATE A DEEPLY SANITIZED VERSION OF THE DATA ---
    const sanitizedData = {
        ...validatedData,
        // Sanitize top-level string fields
        theme: validatedData.theme ? DOMPurify.sanitize(validatedData.theme) : undefined,
        headerImage: validatedData.headerImage ? DOMPurify.sanitize(validatedData.headerImage) : '',
        backgroundImage: validatedData.backgroundImage ? DOMPurify.sanitize(validatedData.backgroundImage) : '',

        // Sanitize nested objects
        customColors: validatedData.customColors ? {
            background: DOMPurify.sanitize(validatedData.customColors.background),
            surface: DOMPurify.sanitize(validatedData.customColors.surface),
            accent: DOMPurify.sanitize(validatedData.customColors.accent),
        } : undefined,

        // Sanitize arrays of strings
        sections: validatedData.sections.map(section => DOMPurify.sanitize(section)),

        // Numeric and boolean fields from Zod are already safe and don't need sanitization
    };


    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const usersCollection = db.collection('users');

    // --- (3) UPDATE THE DATABASE WITH THE SANITIZED DATA ---
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          'design': sanitizedData, // Use the clean data object
          'updatedAt': new Date(),
        },
      }
    );
    await cacheDel(`user:profile:${user.username}`);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Design updated successfully' }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Design update error:', error);
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
  }
}