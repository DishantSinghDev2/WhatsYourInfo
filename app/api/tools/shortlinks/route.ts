// app/api/tools/shortlinks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const createLinkSchema = z.object({
  slug: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores.'),
  destinationUrl: z.string().url(),
});

// GET: List all of a user's short links
export async function GET(request: NextRequest) {
    const user = await getUserFromToken(request);
    if(!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const db = (await clientPromise).db('whatsyourinfo');
    const links = await db.collection('shortlinks').find({ userId: new ObjectId(user._id) }).toArray();
    return NextResponse.json(links);
}

// POST: Create a new short link
export async function POST(request: NextRequest) {
    const user = await getUserFromToken(request);
    if(!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { slug, destinationUrl } = createLinkSchema.parse(body);

        const db = (await clientPromise).db('whatsyourinfo');
        const existing = await db.collection('shortlinks').findOne({ slug });
        if(existing) return NextResponse.json({ error: 'This short link slug is already in use.' }, { status: 409 });

        const newLink = {
            userId: new ObjectId(user._id),
            slug,
            destinationUrl,
            createdAt: new Date(),
            clickCount: 0,
        };
        await db.collection('shortlinks').insertOne(newLink);
        return NextResponse.json(newLink, { status: 201 });
    } catch(error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.flatten() }, { status: 400 });
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}