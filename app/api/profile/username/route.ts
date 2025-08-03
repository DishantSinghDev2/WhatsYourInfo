// app/api/profile/username/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { cacheDel } from '@/lib/cache';

// Zod schema to enforce username rules
const usernameSchema = z.string()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username cannot exceed 20 characters" })
  .regex(/^[a-zA-Z0-9_.-]+$/, { message: "Username can only contain letters, numbers, and underscores" });

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await request.json();
    
    // Validate the new username against the schema
    const validatedUsername = usernameSchema.parse(username);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const usersCollection = db.collection('users');

    // Check if the username is already in use by another user
    const existingUser = await usersCollection.findOne({ 
      username: validatedUsername, 
      _id: { $ne: new ObjectId(user._id) } 
    });

    if (existingUser) {
      return NextResponse.json({ error: 'This username is already taken.' }, { status: 409 });
    }

    // If validation and checks pass, update the user's document
    await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { username: validatedUsername, updatedAt: new Date() } }
    );
    await cacheDel(`user:profile:${user.username}`); // old username
    await cacheDel(`user:profile:${validatedUsername}`); // new username



    return NextResponse.json({ message: 'Username updated successfully.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return a user-friendly validation error
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Username update error:", error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}