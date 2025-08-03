// app/api/profile/design/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth'; // ASSUMPTION: This utility exists to get the authenticated user
import clientPromise from '@/lib/mongodb'; // ASSUMPTION: This is your configured MongoDB client
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache';

// Zod schema for validating the incoming design data
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
  sections: z.array(z.string()), // Expects an array of section keys
  visibility: z.record(z.boolean()), // Expects an object like { 'Links': true, 'Gallery': false }
});

export async function PUT(request: NextRequest) {
  // 1. Authenticate the user from the request token
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Parse and validate the request body against the schema
    const body = await request.json();
    const validatedData = designSchema.parse(body);

    // 3. Connect to the database
    const client = await clientPromise;
    const db = client.db('whatsyourinfo'); // Use your database name
    const usersCollection = db.collection('users');

    // 4. Update the user's document with the new design settings
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(user._id) }, // Find the user by their ID
      {
        $set: {
          'design': validatedData,
          'updatedAt': new Date(),
        },
      }
    );
    await cacheDel(`user:profile:${user.username}`);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 5. Return a success response
    return NextResponse.json({ message: 'Design updated successfully' }, { status: 200 });

  } catch (error) {
    // Handle validation errors from Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    // Handle other potential errors
    console.error('Design update error:', error);
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
  }
}