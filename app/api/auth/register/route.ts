import { NextRequest, NextResponse } from 'next/server';
import { createUser, User } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { isValidEmail, isValidUsername } from '@/lib/utils';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);
    const { email, password, username, firstName, lastName } = validatedData;

    // Additional validation
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const existingUser = await db.collection('users').findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({
      email,
      password,
      username,
      firstName,
      lastName,
    });

    // Remove password from response
    const { ...userResponse } = user as User;

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: { ...userResponse, password: null }
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}