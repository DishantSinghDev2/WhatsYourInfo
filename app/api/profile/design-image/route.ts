// app/api/profile/design-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ... (uploadToCloudflareR2 and POST function remain the same) ...
async function uploadToCloudflareR2(file: File, key: string, type: 'header' | 'background'): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const uploadUrl = `${process.env.R2_WORKER_UPLOAD_URL}?key=${encodeURIComponent(key)}&type=${type}`;
    
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
  
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return publicUrl;
}

export async function POST(request: NextRequest) {
    // ... (Your existing POST logic is unchanged)
    try {
        const user = await getUserFromToken(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as 'header' | 'background' | null;

        if (!file || !type) return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });

        const key = `${type}s/${user.username}-${Date.now()}.${(file.name.split('.').pop() || 'jpg')}`;
        const imageUrl = await uploadToCloudflareR2(file, key, type);

        const client = await clientPromise;
        const db = client.db('whatsyourinfo');
        const updateField = `design.${type}Image`;
        
        await db.collection('users').updateOne(
          { _id: new ObjectId(user._id) },
          { $set: { [updateField]: imageUrl, updatedAt: new Date() } }
        );

        return NextResponse.json({ message: 'Image uploaded', imageUrl });
    } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}


// --- NEW DELETE FUNCTION ---
export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = (await request.json()) as { type: 'header' | 'background' };
    if (!type || !['header', 'background'].includes(type)) {
      return NextResponse.json({ error: 'Invalid image type provided' }, { status: 400 });
    }

    // 2. Get the current image URL from the user's DB record for security
    const imageUrl = user.design?.[`${type}Image`];
    if (!imageUrl) {
      return NextResponse.json({ message: 'No image to delete' });
    }

    // 3. Extract the R2 key from the URL (e.g., "headers/user-123.jpg")
    const key = imageUrl.substring(imageUrl.indexOf(`${type}s/`));

    // 4. Call the worker to delete the object from R2
    const deleteUrl = `${process.env.R2_WORKER_UPLOAD_URL}?key=${encodeURIComponent(key)}&type=${type}`;
    const deleteRes = await fetch(deleteUrl, { method: 'DELETE' });

    if (!deleteRes.ok) {
      // Log the error but don't block the DB update, as the file might already be gone
      console.error(`Failed to delete '${key}' from R2:`, await deleteRes.text());
    }

    // 5. Remove the image field from the user's document in MongoDB
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const updateField = `design.${type}Image`;

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $unset: { [updateField]: "" }, $set: { updatedAt: new Date() } } // Use $unset to completely remove the field
    );

    return NextResponse.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}