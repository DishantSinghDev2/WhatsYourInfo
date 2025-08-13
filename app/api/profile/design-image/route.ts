// app/api/profile/design-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod'; // --- (1) IMPORT ZOD ---

// --- (2) DEFINE CONSTANTS FOR VALIDATION ---
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5; // 5 MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;


async function uploadToCloudflareR2(file: File, key: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    // The `type` parameter in the worker URL seems redundant if the key already has a folder,
    // but we'll keep it for consistency with your existing worker logic.
    // The key itself determines the folder, e.g., "headers/..." or "backgrounds/...".
    const uploadUrl = `${process.env.R2_WORKER_UPLOAD_URL}?key=${encodeURIComponent(key)}`;

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: arrayBuffer,
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('R2 upload failed:', body);
      throw new Error('Failed to upload file to storage bucket.');
    }

    return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string | null;

        // --- (3) STRICT VALIDATION OF INPUTS ---
        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }
        if (!type || !['header', 'background'].includes(type)) {
            return NextResponse.json({ error: 'Invalid image type specified.' }, { status: 400 });
        }

        // --- (4) FILE VALIDATION (TYPE & SIZE) ---
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json({ error: `Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.` }, { status: 400 });
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` }, { status: 400 });
        }

        const key = `${type}s/${user.username}-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
        const imageUrl = await uploadToCloudflareR2(file, key);

        const client = await clientPromise;
        const db = client.db('whatsyourinfo');
        // The `type` is validated, so this dynamic key is safe.
        const updateField = `design.${type}Image`;

        await db.collection('users').updateOne(
          { _id: new ObjectId(user._id) },
          { $set: { [updateField]: imageUrl, updatedAt: new Date() } }
        );

        return NextResponse.json({ message: 'Image uploaded successfully.', imageUrl });
    } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
    }
}


// --- DELETE FUNCTION ---
// --- (5) USE ZOD FOR BODY VALIDATION IN DELETE ---
const deleteSchema = z.object({
  type: z.enum(['header', 'background']),
});

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = deleteSchema.parse(body);

    // This is a great security practice - get the key from a trusted source (the DB).
    const imageUrl = user.design?.[`${type}Image`];
    if (!imageUrl) {
      return NextResponse.json({ message: 'No image to delete.' });
    }

    const key = imageUrl.substring(imageUrl.indexOf(`${type}s/`));

    const deleteUrl = `${process.env.R2_WORKER_UPLOAD_URL}?key=${encodeURIComponent(key)}`;
    const deleteRes = await fetch(deleteUrl, { method: 'DELETE' });

    if (!deleteRes.ok) {
      console.error(`Failed to delete '${key}' from R2:`, await deleteRes.text());
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const updateField = `design.${type}Image`;

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $unset: { [updateField]: "" }, $set: { updatedAt: new Date() } }
    );

    return NextResponse.json({ message: 'Image deleted successfully.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Image deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete image.' }, { status: 500 });
  }
}