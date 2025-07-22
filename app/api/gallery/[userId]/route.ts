import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const galleryItemSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().url('Valid URL is required'),
  title: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const galleryItems = await db.collection('gallery')
      .find({ userId: params.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      items: galleryItems.map(item => ({
        ...item,
        _id: item._id.toString(),
      }))
    });

  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromToken(request);

    if (!user || user._id !== params.userId || !user.isProUser) {
      return NextResponse.json(
        { error: 'Unauthorized or Pro subscription required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = galleryItemSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const galleryItem = {
      userId: user._id,
      type: validatedData.type,
      url: validatedData.url,
      title: validatedData.title || '',
      description: validatedData.description || '',
      createdAt: new Date(),
    };

    const result = await db.collection('gallery').insertOne(galleryItem);

    return NextResponse.json({
      message: 'Gallery item added successfully',
      item: {
        ...galleryItem,
        _id: result.insertedId.toString(),
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Gallery creation error:', error);
    return NextResponse.json(
      { error: 'Failed to add gallery item' },
      { status: 500 }
    );
  }
}