// File: /app/api/profile/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth'; // Assuming you're using session-based auth
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache';

export async function PUT(req: NextRequest) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (!body.profileVisibility) return NextResponse.json({ error: 'Missing profileVisibility' }, { status: 400 })

  const client = await clientPromise;
  const db = client.db();
  const users = db.collection('users');

  await users.updateOne(
    { _id: new ObjectId(user._id) },
    { $set: { profileVisibility: body.profileVisibility } }
  );

  await cacheDel(`user:profile:${user.username}`);

  return NextResponse.json({ success: true });
}
