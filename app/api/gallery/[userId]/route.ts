import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// --- (2) STRENGTHEN THE ZOD SCHEMA ---
const galleryItemSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().trim().url('Valid URL is required'),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
});


export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // --- (3) SANITIZE THE USERID FROM THE PATH ---
    const sanitizedUserId = DOMPurify.sanitize(params.userId);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Use the sanitized ID for the database query
    const galleryItems = await db.collection('gallery')
      .find({ userId: sanitizedUserId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      // Data is already sanitized in the DB, so it's safe to return.
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

    // Excellent authorization check - no changes needed here.
    if (!user || user._id.toString() !== params.userId || !user.isProUser) {
      return NextResponse.json(
        { error: 'Unauthorized or Pro subscription required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = galleryItemSchema.parse(body);

    // --- (4) SANITIZE ALL USER-PROVIDED STRINGS ---
    const sanitizedUrl = DOMPurify.sanitize(validatedData.url);
    const sanitizedTitle = validatedData.title ? DOMPurify.sanitize(validatedData.title) : '';
    const sanitizedDescription = validatedData.description ? DOMPurify.sanitize(validatedData.description) : '';


    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (5) STORE THE SANITIZED DATA ---
    const galleryItem = {
      userId: user._id,
      type: validatedData.type, // This is from an enum, so it's already safe
      url: sanitizedUrl,
      title: sanitizedTitle,
      description: sanitizedDescription,
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