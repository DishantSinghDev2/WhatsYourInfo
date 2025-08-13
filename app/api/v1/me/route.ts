import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAndAuthorizeToken } from '@/lib/api-auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

/**
 * --- GET /api/v1/me ---
 * (This handler is already secure as it only reads data and projects out sensitive fields)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAndAuthorizeToken(request, ['profile:read']);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Invalid token or missing required scope (profile:read).' }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  const userProfile = await db.collection('users').findOne(
    { _id: new ObjectId(auth.userId) },
    { projection: { password: 0, emailVerificationToken: 0, paypalSubscriptionId: 0, recoveryCodes: 0, twoFactorSecret: 0 } }
  );

  if (!userProfile) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  
  if (!auth.scopes.includes('email:read')) {
      delete userProfile.email;
  }

  return NextResponse.json(userProfile);
}

// Zod schema remains the same for structural validation.
const updateProfileSchema = z.object({
  // ... (your excellent Zod schema is unchanged)
  firstName: z.string().min(1, "First name is required").max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50).optional(),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters.").optional(),
  showWalletOnPublic: z.boolean().optional(),
  interests: z.array(z.string().max(30)).max(20, "You can have a maximum of 20 interests.").optional(),
  links: z.array(z.object({ title: z.string().min(1).max(50), url: z.string().url(), })).max(20).optional(),
  wallet: z.array(z.object({ paymentType: z.string().min(1).max(20), address: z.string().min(1).max(100), })).max(10).optional(),
  gallery: z.array(z.object({ imageUrl: z.string().url(), caption: z.string().max(140).optional(), })).max(12).optional(),
  spotlightButton: z.object({ text: z.string().max(30), url: z.string().url(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/), }).optional(),
  design: z.object({
    theme: z.string().optional(),
    customColors: z.object({ background: z.string(), surface: z.string(), accent: z.string(), }).optional(),
    headerImage: z.string().url().optional().or(z.literal('')),
    backgroundImage: z.string().url().optional().or(z.literal('')),
    backgroundBlur: z.number().min(0).max(40).optional(),
    backgroundOpacity: z.number().min(0).max(100).optional(),
    sections: z.array(z.string()).optional(),
    visibility: z.record(z.boolean()).optional(),
  }).optional(),
});


/**
 * --- (2) A RECURSIVE SANITIZATION FUNCTION ---
 * This function walks through any object or array and sanitizes every string value.
 */
function sanitizeRecursively(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeRecursively(item));
  }

  if (data !== null && typeof data === 'object') {
    const sanitizedObject: { [key: string]: any } = {};
    for (const key in data) {
      sanitizedObject[key] = sanitizeRecursively(data[key]);
    }
    return sanitizedObject;
  }

  if (typeof data === 'string') {
    return DOMPurify.sanitize(data);
  }

  // Return numbers, booleans, null, etc. as is.
  return data;
}


/**
 * --- PUT /api/v1/me ---
 * Updates the profile of the authenticated user.
 */
export async function PUT(request: NextRequest) {
  const auth = await verifyAndAuthorizeToken(request, ['profile:write']);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Invalid token or missing required scope (profile:write).' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);
    
    // --- (3) DEEPLY SANITIZE THE ENTIRE VALIDATED OBJECT ---
    const sanitizedData = sanitizeRecursively(validatedData);

    const updatePayload: Record<string, any> = { ...sanitizedData };
    
    if (!auth.isProUser && 'spotlightButton' in updatePayload) {
      delete updatePayload.spotlightButton;
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // --- (4) STORE THE SANITIZED DATA ---
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