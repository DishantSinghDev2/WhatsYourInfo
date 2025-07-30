// app/types/index.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

// Use your existing in-house auth system to get the logged-in user
import { getInHouseUserFromRequest } from '@/lib/in-house-auth';
import { UserProfile } from '@/types';
import { getUserFromToken } from '@/lib/auth';

// --- Zod Schema for validation on PUT requests ---
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters.').optional(),
  socialLinks: z.object({
    twitter: z.string().url().or(z.literal('')).optional(),
    linkedin: z.string().url().or(z.literal('')).optional(),
    github: z.string().url().or(z.literal('')).optional(),
    website: z.string().url().or(z.literal('')).optional(),
  }).optional(),
  spotlightButton: z.object({
    text: z.string().max(30),
    url: z.string().url().or(z.literal('')),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  }).optional(),
});

/**
 * --- GET: Fetch Complete Profile for Authenticated User ---
 * Retrieves all details for the currently logged-in user. This is used
 * to populate the dashboard when the user first visits the page.
 */
export async function GET(request: NextRequest) {
  try {
    const userFromToken = await getUserFromToken(request);

    if (!userFromToken || !userFromToken._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Fetch the full, up-to-date user object, excluding the password
    const userProfile = await db.collection('users').findOne(
      { _id: new ObjectId(userFromToken._id) },
      { projection: { password: 0 } }
    );

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the complete user profile object
    return NextResponse.json(userProfile);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * --- PUT: Update Core Profile Details ---
 * Saves changes made by the user in the "My Profile" panel of the dashboard.
 */
export async function PUT(request: NextRequest) {
  try {
    const userFromToken = await getUserFromToken(request);

    if (!userFromToken || !userFromToken._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Construct the data payload to be set in the database
    const updatePayload: Partial<UserProfile> = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      bio: validatedData.bio || '',
      spotlightButton: validatedData.spotlightButton,
      updatedAt: new Date(),
    };

    // Conditionally add the spotlight button only if the user is Pro
    // This prevents a non-pro user from maliciously crafting a request
    if (userFromToken.isProUser && validatedData.spotlightButton) {
      updatePayload.spotlightButton = validatedData.spotlightButton;
    }

    // Use findOneAndUpdate to get the updated document back in one atomic operation
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(userFromToken._id) },
      { $set: updatePayload },
      {
        returnDocument: 'after', // Important: returns the document *after* the update
        projection: { password: 0 } // Always exclude the password
      }
    );

    if (!result) {
      return NextResponse.json({ error: 'User not found during update' }, { status: 404 });
    }
    
    // The user object is already in the correct shape from the DB operation
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Provide detailed validation errors to the client for better UX
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}