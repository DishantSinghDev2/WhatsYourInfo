import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ✅ Validate file type and size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // ✅ Upload to R2 via Worker
    const avatarKey = await uploadToCloudflareR2(file, user.username);

    // ✅ Save avatar key in MongoDB
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          avatar: avatarKey,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: `https://whatsyour.info/api/avatars/${user.username}`,
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

async function uploadToCloudflareR2(file: File, username: string): Promise<string> {
  const fileExtension = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const key = `avatars/${username}-${Date.now()}.${fileExtension}`;
  const arrayBuffer = await file.arrayBuffer();

  const res = await fetch(`${process.env.R2_WORKER_UPLOAD_URL}?key=${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: arrayBuffer,
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Upload failed with status', res.status, body);
    throw new Error('Failed to upload to R2');
  }

  return key; // key stored in DB
}
