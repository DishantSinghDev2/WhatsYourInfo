import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

interface Link {
  _id: ObjectId;
  title: string;
  url: string;
}

interface UserDocument {
  _id: ObjectId;
  links: Link[]; // define `links` as an array
  // Add other fields if needed
}

// Schema for a single link
const linkSchema = z.object({
  id: z.string().optional(), // Used for identifying existing links to update
  title: z.string().min(1, 'Title cannot be empty').max(100),
  url: z.string().url('Please enter a valid URL'),
});

// Schema for the entire array of links (for reordering)
const linksArraySchema = z.array(linkSchema);

// --- POST: Add a new link ---
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = linkSchema.parse(body);

    const newLink = {
      _id: new ObjectId(),
      title: validatedData.title,
      url: validatedData.url,
    };

    const client = await clientPromise;
const db = client.db('whatsyourinfo');

// Use typed collection
const usersCollection = db.collection<UserDocument>('users');

await usersCollection.updateOne(
  { _id: new ObjectId(user._id) },
  { $push: { links: newLink } }
);

    return NextResponse.json({ message: 'Link added successfully', link: newLink }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add link' }, { status: 500 });
  }
}

// --- PUT: Update an existing link or the entire order ---
export async function PUT(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Check if the body is an array for reordering
    if (Array.isArray(body)) {
      const validatedLinks = linksArraySchema.parse(body);
      const client = await clientPromise;
      const db = client.db('whatsyourinfo');
      
      // Atomically update the entire array
      await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        { $set: { links: validatedLinks.map(l => ({...l, _id: new ObjectId(l.id)})) } }
      );
      
      return NextResponse.json({ message: 'Links reordered successfully.' });
    }

    // Otherwise, assume it's a single link update
    const { id, ...linkData } = linkSchema.parse(body);
    if (!id) {
        return NextResponse.json({ error: 'Link ID is required for an update.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    await db.collection('users').updateOne(
        { _id: new ObjectId(user._id), "links._id": new ObjectId(id) },
        { $set: { "links.$.title": linkData.title, "links.$.url": linkData.url } }
    );
    
    return NextResponse.json({ message: 'Link updated successfully.' });

  } catch {
    return NextResponse.json({ error: 'Failed to update link(s)' }, { status: 500 });
  }
}

// --- DELETE: Remove a link ---
export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get('id');
  if (!linkId) {
    return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    await db.collection<UserDocument>('users').updateOne(
        { _id: new ObjectId(user._id) },
        { $pull: { links: { _id: new ObjectId(linkId) } } }
    );

    return NextResponse.json({ message: 'Link removed successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to remove link' }, { status: 500 });
  }
}