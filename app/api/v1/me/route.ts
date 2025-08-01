import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAndAuthorizeToken } from '@/lib/api-auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * --- GET /api/v1/me ---
 * Fetches the complete but sanitized profile for the authenticated user.
 * Requires the 'profile:read' scope.
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate and Authorize: Check for a valid token with the 'profile:read' permission.
  const auth = await verifyAndAuthorizeToken(request, ['profile:read']);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Invalid token or missing required scope (profile:read).' }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  const userProfile = await db.collection('users').findOne(
    { _id: new ObjectId(auth.userId) },
    {
      projection: { password: 0, emailVerificationToken: 0, paypalSubscriptionId: 0, recoveryCodes: 0, twoFactorSecret: 0 }
    }
  );

  if (!userProfile) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  
  // Conditionally return email only if the token has the correct scope
  if (!auth.scopes.includes('email:read')) {
      delete userProfile.email;
  }

  return NextResponse.json(userProfile);
}

// --- Zod Schema for validating all updatable profile fields ---
const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50).optional(),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters.").optional(),
  showWalletOnPublic: z.boolean().optional(),
  interests: z.array(z.string().max(30)).max(20, "You can have a maximum of 20 interests.").optional(),
  
  // Validation for an array of link objects
  links: z.array(z.object({
    title: z.string().min(1).max(50),
    url: z.string().url("Link URL must be a valid URL."),
  })).max(20, "You can have a maximum of 20 links.").optional(),

  // Validation for an array of wallet objects
  wallet: z.array(z.object({
    paymentType: z.string().min(1).max(20),
    address: z.string().min(1).max(100),
  })).max(10, "You can have a maximum of 10 wallet addresses.").optional(),

  // Validation for an array of gallery items
  gallery: z.array(z.object({
    imageUrl: z.string().url("Gallery image URL must be a valid URL."),
    caption: z.string().max(140).optional(),
  })).max(12, "You can have a maximum of 12 gallery items.").optional(),
  
  // Spotlight Button (Only applied if the user is Pro)
  spotlightButton: z.object({
    text: z.string().max(30),
    url: z.string().url(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  }).optional(),

  // Design object validation
  design: z.object({
    theme: z.string().optional(),
    customColors: z.object({
      background: z.string(),
      surface: z.string(),
      accent: z.string(),
    }).optional(),
    headerImage: z.string().url().optional().or(z.literal('')),
    backgroundImage: z.string().url().optional().or(z.literal('')),
    backgroundBlur: z.number().min(0).max(40).optional(),
    backgroundOpacity: z.number().min(0).max(100).optional(),
    sections: z.array(z.string()).optional(),
    visibility: z.record(z.boolean()).optional(),
  }).optional(),
});


/**
 * --- PUT /api/v1/me ---
 * Updates the profile of the authenticated user.
 * Requires the 'profile:write' scope.
 */
export async function PUT(request: NextRequest) {
  // 1. Authenticate and Authorize: Check for a valid token with the 'profile:write' permission.
  const auth = await verifyAndAuthorizeToken(request, ['profile:write']);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Invalid token or missing required scope (profile:write).' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);
    
    const updatePayload: Record<string, any> = { ...validatedData };
    
    // Pro-level feature check (using the live pro status from the auth function)
    if (!auth.isProUser && 'spotlightButton' in updatePayload) {
      delete updatePayload.spotlightButton;
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.userId) },
      { $set: { ...updatePayload, updatedAt: new Date() } }
    );
    
    return NextResponse.json({ message: 'Profile updated successfully.' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("API /v1/me PUT Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}