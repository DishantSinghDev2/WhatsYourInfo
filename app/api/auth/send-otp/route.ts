import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import crypto from 'crypto';

const sendOtpSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = sendOtpSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Check if user exists
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          loginOtp: otp,
          loginOtpExpires: otpExpires,
          updatedAt: new Date()
        }
      }
    );

    // TODO: Send OTP via email
    // This would integrate with your email service (SendGrid, etc.)
    console.log(`OTP for ${email}: ${otp}`); // For development

    return NextResponse.json({
      message: 'OTP sent successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('OTP send error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}