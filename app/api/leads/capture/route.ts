import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const leadCaptureSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  message: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = leadCaptureSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Verify the username exists and is a Pro user
    const user = await db.collection('users').findOne(
      { username: validatedData.username, isProUser: true },
      { projection: { _id: 1, email: 1, firstName: 1, lastName: 1 } }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Profile not found or lead capture not available' },
        { status: 404 }
      );
    }

    // Store the lead
    const leadData = {
      userId: user._id,
      username: validatedData.username,
      name: validatedData.name,
      email: validatedData.email,
      message: validatedData.message || '',
      source: validatedData.source || 'profile',
      timestamp: new Date(),
      status: 'new',
    };

    const result = await db.collection('leads').insertOne(leadData);

    // TODO: Send email notification to profile owner
    // This would integrate with your email service (SendGrid, etc.)

    return NextResponse.json({
      message: 'Lead captured successfully',
      leadId: result.insertedId.toString()
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}