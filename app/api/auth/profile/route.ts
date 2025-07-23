import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  spotlightButton: z.object({
    text: z.string().optional(),
    url: z.string().optional(),
    color: z.string().optional(),
  }).optional(),
});

interface User {
  firstName: string;
  lastName: string;
  bio: string;
  socialLinks: { twitter?: string; linkedin?: string; github?: string; website?: string; };
  updatedAt: Date;
  spotlightButton?: { text?: string; url?: string; color?: string; };
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const updateData: User = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      bio: validatedData.bio || '',
      socialLinks: validatedData.socialLinks || {},
      updatedAt: new Date(),
    };

    // Only update spotlight button for Pro users
    if (user.isProUser && validatedData.spotlightButton) {
      updateData.spotlightButton = validatedData.spotlightButton;
    }

    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(user._id) },
      { $set: updateData },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        ...result,
        _id: result._id.toString(),
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}