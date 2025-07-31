import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { z } from 'zod';
import clientPromise from '@/lib/mongodb'; // Import clientPromise
import { ObjectId } from 'mongodb';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    let recovered = false

    // --- NEW: RECOVERY LOGIC ---
    if (user.deactivatedAt) {
      // This is a recovery attempt. Reactivate the account.
      const client = await clientPromise;
      const db = client.db('whatsyourinfo');
      await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        { $unset: { deactivatedAt: 1 } } // Remove the deactivation flag
      );
      
      recovered = true
    }



    // Generate JWT token
    const token = generateToken({ userId: user._id, emailVerified: user.emailVerified });

    // Create response with user data
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isProUser: user.isProUser,
          emailVerified: user.emailVerified,
        },
        recovered
      },
      { status: 200 }
    );

    if (!user.emailVerified) {
      await fetch(`${process.env.FRONTEND_URL || `localhost:3000`}/api/auth/send-otp`, {
        method: "POST",
        body: JSON.stringify({
          email: user.email
        })
      })
    }

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}