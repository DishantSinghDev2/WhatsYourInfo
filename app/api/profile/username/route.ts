// app/api/profile/username/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { cacheDel } from '@/lib/cache';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// --- (2) STRENGTHEN THE ZOD SCHEMA (added .trim() and made regex stricter) ---
const usernameSchema = z.string()
  .trim() // Remove leading/trailing whitespace first
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username cannot exceed 20 characters" })
  // Regex ensures it only contains letters, numbers, and underscores. Hyphens and dots can be tricky.
  .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" });

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await request.json();
    
    // Validate the new username against the schema
    const validatedUsername = usernameSchema.parse(username);

    // --- (3) SANITIZE THE VALIDATED USERNAME ---
    // This provides defense-in-depth, ensuring no tricky characters make it through.
    const sanitizedUsername = DOMPurify.sanitize(validatedUsername);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const usersCollection = db.collection('users');

    // --- (4) USE THE SANITIZED USERNAME FOR ALL DB OPERATIONS ---
    // Check if the username is already in use by another user
    const existingUser = await usersCollection.findOne({ 
      username: sanitizedUsername, 
      _id: { $ne: new ObjectId(user._id) } 
    });

    if (existingUser) {
      return NextResponse.json({ error: 'This username is already taken.' }, { status: 409 });
    }

    // Update the user's document with the clean, sanitized username
    await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { username: sanitizedUsername, updatedAt: new Date() } }
    );
    
    await cacheDel(`user:profile:${user.username}`);
    await cacheDel(`user:profile:${sanitizedUsername}`);

    return NextResponse.json({ message: 'Username updated successfully.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Username update error:", error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}