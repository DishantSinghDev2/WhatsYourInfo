// /home/dit/WhatsYourInfo/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken, User } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
// isValidEmail and isValidUsername are now handled by Zod, so they can be removed if not used elsewhere
import { z } from 'zod';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---
import { generateAndSendOtp } from '@/lib/otp'; // --- (1) IMPORT THE NEW FUNCTION ---
import { ObjectId } from 'mongodb';


// --- (2) STRENGTHEN THE ZOD SCHEMA ---
// We can add .trim() to automatically remove leading/trailing whitespace
// and refine the regex for the username for better security.
const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  profileVisibility: z.enum(['public', 'private']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // A stricter regex to ensure it only contains allowed characters
  username: z.string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- (3) VALIDATE THE INPUT (No change here, this is correct) ---
    const validatedData = registerSchema.parse(body);
    const { email, password, username, firstName, lastName, profileVisibility } = validatedData;

    // --- (4) SANITIZE THE INPUTS ---
    // This is the new, crucial step. We clean the string fields before using them.
    const sanitizedFirstName = DOMPurify.sanitize(firstName);
    const sanitizedLastName = DOMPurify.sanitize(lastName);
    const sanitizedUsername = DOMPurify.sanitize(username);
    // Email is validated by Zod for structure, but sanitizing is a good defense-in-depth measure.
    const sanitizedEmail = DOMPurify.sanitize(email);

    // Your additional validation checks with isValidEmail and isValidUsername are no longer needed
    // because Zod's .email() and .regex() rules handle this more effectively.

    // Check if user already exists
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const existingUser = await db.collection('users').findOne({
      // Use the sanitized email and username for the database query
      $or: [{ email: sanitizedEmail }, { username: sanitizedUsername }]
    });

    if (existingUser) {
      const field = existingUser.email === sanitizedEmail ? 'email' : 'username';
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 }
      );
    }

    // --- (5) CREATE USER WITH SANITIZED DATA ---
    // Pass the cleaned data to your user creation function.
    const user = await createUser({
      type: 'personal',
      profileVisibility,
      email: sanitizedEmail,
      password, // Password is not sanitized, it is hashed by createUser
      username: sanitizedUsername,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
    });

    // --- Session Creation Logic (Unchanged) ---
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    const parsedUA = new UAParser(userAgent).getResult();
    const device = `${parsedUA.browser.name} on ${parsedUA.os.name}`;

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const hashedSessionToken = crypto.createHash('sha256').update(sessionToken).digest('hex');

    await db.collection('sessions').insertOne({
      userId: user._id,
      token: hashedSessionToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
      lastUsedAt: new Date(),
      ipAddress,
      userAgent: device,
      is2FAVerified: false,
    });

    const token = generateToken({
      userId: user._id,
      emailVerified: user.emailVerified,
      sessionId: sessionToken
    });

    // --- (2) REPLACE THE FETCH CALL ---
    if (!user.emailVerified) {
      // Call the logic directly instead of using fetch
      await generateAndSendOtp(new ObjectId(user._id), user.email, user.username);
    }
    const { ...userResponse } = user as User;

    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: { ...userResponse, password: null }
      },
      { status: 201 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}