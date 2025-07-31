// app/api/auth/resend-verification/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    
    // Prevent already verified users from using this endpoint
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Your email is already verified.' }, { status: 400 });
    }

    // Trigger the email sending process
    await sendVerificationEmail(user.email, user.firstName );

    return NextResponse.json({ message: 'A new verification email has been sent to your inbox.' });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to resend verification email.' }, { status: 500 });
  }
}