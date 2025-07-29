// app/api/profile/gallery/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Uploads a file to the Cloudflare R2 gallery bucket via the worker.
 */
async function uploadToCloudflareR2(file: File, username: string): Promise<string> {
  const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase();
  const key = `gallery/${username}/${Date.now()}.${fileExtension}`;
  
  const arrayBuffer = await file.arrayBuffer();

  const uploadUrl = `${process.env.R2_WORKER_UPLOAD_URL}?key=${encodeURIComponent(key)}&type=gallery`;

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
  return key;
}

/**
 * Handles POST requests to upload a new gallery photo.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !user.isProUser) {
      return NextResponse.json({ error: 'This feature is for Pro members only.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) return NextResponse.json({ error: 'No photo provided.' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image.' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'File size must be less than 8MB.' }, { status: 400 });

    const photoKey = await uploadToCloudflareR2(file, user.username);
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const newGalleryItem = {
      _id: new ObjectId(),
      key: photoKey,
      caption: '', // Caption can be added later if needed
    };

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $push: { gallery: newGalleryItem } }
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${photoKey}`;
    
    return NextResponse.json({
      message: 'Photo uploaded successfully',
      item: { ...newGalleryItem, url: publicUrl },
    }, { status: 201 });

  } catch (error) {
    console.error('Gallery upload error:', error);
    return NextResponse.json({ error: 'Failed to upload photo.' }, { status: 500 });
  }
}

/**
 * Handles GET requests to fetch all gallery photos for the logged-in user.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const userData = await db.collection('users').findOne(
      { _id: new ObjectId(user._id) },
      { projection: { gallery: 1 } }
    );

    const galleryItems = (userData?.gallery || []).map(item => ({
      ...item,
      url: `${process.env.R2_PUBLIC_URL}/${item.key}`,
    }));

    return NextResponse.json({ items: galleryItems });

  } catch (error) {
    console.error('Fetch gallery error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery.' }, { status: 500 });
  }
}