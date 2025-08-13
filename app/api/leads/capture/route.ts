import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---
import { sendLeadNotificationEmail } from '@/lib/email';

// --- (2) STRENGTHEN THE ZOD SCHEMA ---
const leadCaptureSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  message: z.string().trim().optional(),
  source: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = leadCaptureSchema.parse(body);

    // --- (3) SANITIZE ALL USER-PROVIDED STRINGS ---
    // Clean every field to prevent Stored XSS and other injection attacks.
    const sanitizedUsername = DOMPurify.sanitize(validatedData.username);
    const sanitizedName = DOMPurify.sanitize(validatedData.name);
    const sanitizedEmail = DOMPurify.sanitize(validatedData.email);
    const sanitizedMessage = validatedData.message ? DOMPurify.sanitize(validatedData.message) : '';
    const sanitizedSource = validatedData.source ? DOMPurify.sanitize(validatedData.source) : 'profile';


    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (4) USE SANITIZED USERNAME FOR THE QUERY ---
    // Verify the username exists and is a Pro user
    const user = await db.collection('users').findOne(
      { username: sanitizedUsername, isProUser: true },
      { projection: { _id: 1, email: 1, firstName: 1, lastName: 1 } }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Profile not found or lead capture not available' },
        { status: 404 }
      );
    }

    // --- (5) STORE THE SANITIZED DATA ---
    // The data being inserted into the 'leads' collection is now safe.
    const leadData = {
      userId: user._id,
      username: sanitizedUsername,
      name: sanitizedName,
      email: sanitizedEmail,
      message: sanitizedMessage,
      source: sanitizedSource,
      timestamp: new Date(),
      status: 'new',
    };

    const result = await db.collection('leads').insertOne(leadData);

    const mailData = {
      to: user.email,
      profileOwnerName: user.firstName,
      leadName: sanitizedName,
      leadEmail: sanitizedEmail,
      leadMessage: sanitizedMessage
    }

    // TODO: Send email notification to profile owner
    await sendLeadNotificationEmail(mailData)

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