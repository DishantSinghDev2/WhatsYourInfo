// app/api/tools/shortlinks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// --- (2) STRENGTHEN THE ZOD SCHEMA ---
const createLinkSchema = z.object({
  slug: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores.'),
  destinationUrl: z.string().trim().url({ message: "Please provide a valid destination URL." }),
});

// GET: List all of a user's short links (This handler is already secure)
export async function GET(request: NextRequest) {
    const user = await getUserFromToken(request);
    if(!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const db = (await clientPromise).db('whatsyourinfo');
    // Correctly scoped query is a great security practice.
    const links = await db.collection('shortlinks').find({ userId: new ObjectId(user._id) }).toArray();
    return NextResponse.json(links);
}

// POST: Create a new short link
export async function POST(request: NextRequest) {
    const user = await getUserFromToken(request);
    if(!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        // 1. Validate the structure and format of the input
        const validatedData = createLinkSchema.parse(body);

        // --- (3) SANITIZE THE VALIDATED DATA ---
        // This strips any potential HTML/script content as a defense-in-depth measure.
        const sanitizedSlug = DOMPurify.sanitize(validatedData.slug);
        const sanitizedDestinationUrl = DOMPurify.sanitize(validatedData.destinationUrl);

        const db = (await clientPromise).db('whatsyourinfo');

        // 2. Check for uniqueness using the sanitized slug
        const existing = await db.collection('shortlinks').findOne({ slug: sanitizedSlug });
        if(existing) return NextResponse.json({ error: 'This short link slug is already in use.' }, { status: 409 });

        // --- (4) STORE THE SANITIZED DATA ---
        const newLink = {
            userId: new ObjectId(user._id),
            slug: sanitizedSlug,
            destinationUrl: sanitizedDestinationUrl,
            createdAt: new Date(),
            clickCount: 0,
        };
        await db.collection('shortlinks').insertOne(newLink);
        return NextResponse.json(newLink, { status: 201 });
    } catch(error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
        }
        console.error("Short link creation error:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}