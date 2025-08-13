// app/api/profile/links/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { cacheDel } from '@/lib/cache';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

interface Link {
  _id: ObjectId;
  title: string;
  url: string;
}

interface UserDocument {
  _id: ObjectId;
  links: Link[];
}

// --- (2) STRENGTHENED ZOD SCHEMA ---
const linkSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Title cannot be empty').max(100),
  url: z.string().trim().url('Please enter a valid URL'),
});

const linksArraySchema = z.array(linkSchema);

// --- POST: Add a new link ---
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const validatedData = linkSchema.parse(body);

    // --- (3) SANITIZE USER INPUT ---
    const newLink = {
      _id: new ObjectId(),
      title: DOMPurify.sanitize(validatedData.title),
      url: DOMPurify.sanitize(validatedData.url),
    };

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    await db.collection<UserDocument>('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $push: { links: newLink } }
    );

    await cacheDel(`user:profile:${user.username}`);
    return NextResponse.json({ message: 'Link added successfully', link: newLink }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Add link error:', error);
    return NextResponse.json({ error: 'Failed to add link' }, { status: 500 });
  }
}

// --- PUT: Update an existing link or the entire order ---
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Reordering entire list
    if (Array.isArray(body)) {
      const validatedLinks = linksArraySchema.parse(body);
      
      // --- (4) SANITIZE EACH LINK IN THE ARRAY ---
      const sanitizedLinks = validatedLinks.map(l => ({
        _id: new ObjectId(l.id),
        title: DOMPurify.sanitize(l.title),
        url: DOMPurify.sanitize(l.url),
      }));

      await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        { $set: { links: sanitizedLinks } }
      );

      await cacheDel(`user:profile:${user.username}`);
      return NextResponse.json({ message: 'Links reordered successfully.' });
    }

    // Updating a single link
    const { id, ...linkData } = linkSchema.parse(body);
    if (!id) return NextResponse.json({ error: 'Link ID is required for an update.' }, { status: 400 });

    // --- (5) SANITIZE THE SINGLE LINK DATA ---
    const sanitizedTitle = DOMPurify.sanitize(linkData.title);
    const sanitizedUrl = DOMPurify.sanitize(linkData.url);

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id), "links._id": new ObjectId(id) },
      { $set: { "links.$.title": sanitizedTitle, "links.$.url": sanitizedUrl } }
    );

    await cacheDel(`user:profile:${user.username}`);
    return NextResponse.json({ message: 'Link updated successfully.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Update link(s) error:', error);
    return NextResponse.json({ error: 'Failed to update link(s)' }, { status: 500 });
  }
}

// --- DELETE: Remove a link ---
export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const unsafeLinkId = searchParams.get('id');
  if (!unsafeLinkId) return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
  
  // --- (6) SANITIZE THE LINK ID ---
  const linkId = DOMPurify.sanitize(unsafeLinkId);
  if (!ObjectId.isValid(linkId)) return NextResponse.json({ error: 'Invalid Link ID format' }, { status: 400 });


  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    await db.collection<UserDocument>('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $pull: { links: { _id: new ObjectId(linkId) } } }
    );

    await cacheDel(`user:profile:${user.username}`);
    return NextResponse.json({ message: 'Link removed successfully' });

  } catch (error) {
    console.error('Remove link error:', error);
    return NextResponse.json({ error: 'Failed to remove link' }, { status: 500 });
  }
}