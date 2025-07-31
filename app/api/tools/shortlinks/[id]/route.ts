// app/api/tools/shortlinks/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid link ID format.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // CRITICAL: Ensure the link belongs to the authenticated user before deleting.
    const result = await db.collection('shortlinks').deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user._id),
    });

    if (result.deletedCount === 0) {
      // This means either the link doesn't exist or the user doesn't own it.
      return NextResponse.json({ error: 'Link not found or you do not have permission to delete it.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Short link deleted successfully.' });

  } catch (error) {
    console.error("Short link deletion error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}