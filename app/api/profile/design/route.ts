import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const designSchema = z.object({
  theme: z.string().optional(),
  customColors: z.object({
    background: z.string().optional(),
    surface: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  headerImage: z.string().url().optional().or(z.literal('')),
  backgroundImage: z.string().url().optional().or(z.literal('')),
  sectionsOrder: z.array(z.string()).optional(),
});

export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = designSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const result = await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { design: validatedData, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'No changes were made.' });
    }

    return NextResponse.json({ message: 'Design updated successfully.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Design update error:', error);
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
  }
}