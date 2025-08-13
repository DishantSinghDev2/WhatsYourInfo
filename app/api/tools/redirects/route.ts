// app/api/redirects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getUserFromToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { z } from 'zod'; // --- (1) IMPORT ZOD & SANITIZER
import DOMPurify from 'isomorphic-dompurify';

// --- (2) DEFINE SCHEMAS FOR VALIDATION ---
const redirectSchema = z.object({
  // Enforce safe characters for the slug (letters, numbers, hyphen)
  slug: z.string().trim().min(1).regex(/^[a-zA-Z0-9-]+$/, {
    message: "Slug can only contain letters, numbers, and hyphens.",
  }),
  // Enforce a valid URL format
  url: z.string().trim().url({ message: "Please enter a valid URL." }),
});

const deleteSchema = z.object({
  slug: z.string().trim().min(1, "Slug is required."),
});


// The GET handler is already secure as it only reads data scoped to the user.
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  const userDoc = await db.collection('users').findOne({ _id: new ObjectId(user._id) });
  return NextResponse.json(userDoc?.redirects || []);
}


export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    // --- (3) VALIDATE THE REQUEST BODY ---
    const validatedData = redirectSchema.parse(body);

    // --- (4) SANITIZE THE VALIDATED DATA ---
    const sanitizedSlug = DOMPurify.sanitize(validatedData.slug);
    const sanitizedUrl = DOMPurify.sanitize(validatedData.url);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (5) USE SANITIZED DATA FOR THE UPDATE ---
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $push: { redirects: { slug: sanitizedSlug, url: sanitizedUrl } } }
    );

    return NextResponse.json({ success: true, message: "Redirect created." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error("Redirect POST error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    // --- (3) VALIDATE THE REQUEST BODY ---
    const validatedData = deleteSchema.parse(body);

    // --- (4) SANITIZE THE VALIDATED DATA ---
    const sanitizedSlug = DOMPurify.sanitize(validatedData.slug);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (5) USE SANITIZED DATA FOR THE UPDATE ---
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $pull: { redirects: { slug: sanitizedSlug } } }
    );

    return NextResponse.json({ success: true, message: "Redirect deleted." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error("Redirect DELETE error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}