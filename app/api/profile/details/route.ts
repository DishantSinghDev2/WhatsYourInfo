import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache';

const profileDetailsSchema = z.object({
  firstName: z.string().min(1, "First name cannot be empty."),
  lastName: z.string().min(1, "Last name cannot be empty."),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters.").optional(),
  businessName: z.string().max(100, "Business name cannot exceed 100 characters.").optional(),

});

export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = profileDetailsSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { ...validatedData, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'No changes detected.' });
    }
    await cacheDel(`user:profile:${user.username}`);

    return NextResponse.json({ message: 'Profile details updated successfully.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Profile details update error:', error);
    return NextResponse.json({ error: 'Failed to update profile details' }, { status: 500 });
  }
}