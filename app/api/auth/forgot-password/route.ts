import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const user = await db.collection('users').findOne({ email });

    // SECURITY: Always return a success message, even if the user doesn't exist.
    // This prevents "user enumeration," where an attacker can guess registered emails.
    if (user) {
      // User exists, proceed to send the email
      await sendPasswordResetEmail(user.email, user.firstName);
    }
    
    return NextResponse.json({ message: "If an account with that email exists, a password reset link has been sent." }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}