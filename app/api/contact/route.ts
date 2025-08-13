import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { sendContactUsEmail } from '@/lib/email';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// --- (2) STRENGTHEN THE ZOD SCHEMA ---
// Add .trim() to string fields for better data hygiene.
const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  subject: z.string().trim().min(1, 'Subject is required'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters'),
  type: z.enum(['general', 'technical', 'billing', 'partnership', 'feature', 'bug']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // --- (3) SANITIZE ALL USER-PROVIDED STRINGS ---
    // Clean the data to remove any potential HTML/script tags before storage or use.
    const sanitizedName = DOMPurify.sanitize(validatedData.name);
    const sanitizedEmail = DOMPurify.sanitize(validatedData.email);
    const sanitizedSubject = DOMPurify.sanitize(validatedData.subject);
    const sanitizedMessage = DOMPurify.sanitize(validatedData.message);


    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (4) STORE THE SANITIZED DATA ---
    // The object stored in the database is now clean and safe to render in an admin panel.
    const contactMessage = {
      name: sanitizedName,
      email: sanitizedEmail,
      subject: sanitizedSubject,
      message: sanitizedMessage,
      type: validatedData.type, // This is from an enum, so it's already safe.
      timestamp: new Date(),
      status: 'new',
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    const result = await db.collection('contact_messages').insertOne(contactMessage);

    // --- (5) SEND THE SANITIZED DATA IN THE EMAIL ---
    // Pass the cleaned data to the email function to prevent HTML/Header injection.
    await sendContactUsEmail({
      to: process.env.EMAIL_TO as string,
      name: sanitizedName,
      email: sanitizedEmail,
      subject: sanitizedSubject,
      message: sanitizedMessage,
    });

    return NextResponse.json({
      message: 'Contact message sent successfully',
      id: result.insertedId.toString()
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}