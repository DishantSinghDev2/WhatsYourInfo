// app/api/settings/sessions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

// GET: Fetches all active sessions for the current user
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  const sessions = await db.collection('sessions').find(
    { userId: new ObjectId(user._id), expiresAt: { $gt: new Date() } },
    { sort: { lastUsedAt: -1 } }
  ).toArray();
  console.log(sessions, user.sessionId)

  // Identify the current session
  const currentSessionId = user.sessionId ? crypto.createHash('sha256').update(user.sessionId).digest('hex') : null;

  return NextResponse.json(sessions.map(s => ({
    id: s._id.toString(),
    isCurrent: s.token === currentSessionId,
    ...s
  })));
}

// DELETE: Revokes a specific session (logs out another device)
export async function DELETE(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  
  const client = await clientPromise;
  const db = client.db('whatsyourinfo');
  
  // You can only delete sessions that belong to you
  await db.collection('sessions').deleteOne({ 
    _id: new ObjectId(sessionId),
    userId: new ObjectId(user._id)
  });

  return NextResponse.json({ message: 'Session has been revoked.' });
}