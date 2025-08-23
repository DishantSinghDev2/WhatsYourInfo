import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromToken } from '@/lib/auth';
import { generateAndSendOtp } from '@/lib/otp';
import { ObjectId } from 'mongodb';

const sendOtpSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export async function POST(request: NextRequest) {
  try {
    const userFromToken = await getUserFromToken(request);
    if (!userFromToken || !userFromToken._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // We already have the user's data from the token, no need to query again
    const { _id, email, username } = userFromToken;

    const result = await generateAndSendOtp(new ObjectId(_id), email, username);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' });

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