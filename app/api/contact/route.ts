import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { sendContactUsEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  type: z.enum(['general', 'technical', 'billing', 'partnership', 'feature', 'bug']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Store contact message
    const contactMessage = {
      ...validatedData,
      timestamp: new Date(),
      status: 'new',
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    const result = await db.collection('contact_messages').insertOne(contactMessage);

    await sendContactUsEmail({
      to: process.env.EMAIL_TO,
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message,
    })

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