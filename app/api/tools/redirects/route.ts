import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getUserFromToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const token = await getUserFromToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  const user = await db.collection('users').findOne({ _id: new ObjectId(token._id) });
  return NextResponse.json(user?.redirects || []);
}

export async function POST(request: NextRequest) {
  const token = await getUserFromToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug, url } = await request.json();
  if (!slug || !url) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  await db.collection('users').updateOne(
    { _id: new ObjectId(token._id) },
    { $push: { redirects: { slug, url } } }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const token = await getUserFromToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await request.json();
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  await db.collection('users').updateOne(
    { _id: new ObjectId(token._id) },
    { $pull: { redirects: { slug } } }
  );

  return NextResponse.json({ success: true });
}
