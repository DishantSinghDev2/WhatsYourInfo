// app/api/profile/gallery/[photoId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

async function deleteFromCloudflareR2(key: string): Promise<void> {
  const deleteUrl = `${process.env.R2_WORKER_UPLOAD_URL}?key=${encodeURIComponent(key)}&type=gallery`;
  const res = await fetch(deleteUrl, { method: 'DELETE' });
  if (!res.ok) {
    console.error('R2 delete failed:', await res.text());
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { photoId } = params;
    if (!ObjectId.isValid(photoId)) return NextResponse.json({ error: 'Invalid photo ID.' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const userData = await db.collection('users').findOne(
      { _id: new ObjectId(user._id), "gallery._id": new ObjectId(photoId) },
      { projection: { "gallery.$": 1 } }
    );

    const photoToDelete = userData?.gallery?.[0];
    if (!photoToDelete) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $pull: { gallery: { _id: new ObjectId(photoId) } } }
    );
    
    await deleteFromCloudflareR2(photoToDelete.key);

    return NextResponse.json({ message: 'Photo deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json({ error: 'Failed to delete photo.' }, { status: 500 });
  }
}