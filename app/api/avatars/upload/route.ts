// app/api/avatars/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Uploads a file to a Cloudflare R2 bucket via a worker.
 * The worker should handle the PUT request and store the file.
 */
async function uploadToCloudflareR2(file: File, username: string): Promise<string> {
  // Generate a unique key for the file to prevent overwrites and caching issues.
  const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase();
  const key = `avatars/${username}-${Date.now()}.${fileExtension}`;
  
  const arrayBuffer = await file.arrayBuffer();

  // The worker URL must be configured to accept PUT requests with 'key' and 'type' params.
  const uploadUrl = `${process.env.R2_WORKER_UPLOAD_URL}?key=${encodeURIComponent(key)}&type=avatar`;

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: arrayBuffer,
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('R2 upload failed:', body);
    throw new Error('Failed to upload file to storage bucket.');
  }

  // Return the key, which will be stored in the database.
  // The public URL will be constructed on the client via the GET route.
  return key;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    // --- Validation ---
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image.' }, { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      return NextResponse.json({ error: 'File size must be less than 4MB.' }, { status: 400 });
    }

    // --- Upload and DB Update ---
    const avatarKey = await uploadToCloudflareR2(file, user.username);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          avatar: avatarKey, // Save the R2 object key
          updatedAt: new Date(),
        },
      }
    );

    // The client will construct the new URL, but we confirm success.
    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatarKey: avatarKey, // Return the key for immediate preview
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar.' }, { status: 500 });
  }
}