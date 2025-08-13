// File: /app/api/profile/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cacheDel } from '@/lib/cache';
import { z } from 'zod'; // --- (1) IMPORT ZOD & SANITIZER
import DOMPurify from 'isomorphic-dompurify';

// --- (2) DEFINE A STRICT SCHEMA FOR YOUR SETTINGS ---
// This is an EXAMPLE. You MUST define every field you expect in your settings object.
// Any field not defined here will be rejected, preventing mass assignment.
const settingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private']).optional(),
  allowContactForm: z.boolean().optional(),
  // Example of a text field that needs sanitization
  customStatus: z.string().max(100, "Status must be 100 characters or less.").optional(),
});


export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // --- (3) VALIDATE THE INCOMING DATA AGAINST THE SCHEMA ---
    // We parse body.settings directly. If 'settings' is missing, Zod will throw.
    const validatedSettings = settingsSchema.parse(body.settings);

    // --- (4) SANITIZE ALL STRING FIELDS ---
    // This ensures no malicious HTML or scripts are stored.
    const sanitizedSettings = { ...validatedSettings };
    if (validatedSettings.customStatus) {
        sanitizedSettings.customStatus = DOMPurify.sanitize(validatedSettings.customStatus);
    }
    // Add sanitization for any other string fields here...

    const client = await clientPromise;
    const db = client.db('whatsyourinfo'); // Explicitly name your database
    const users = db.collection('users');

    // --- (5) CONSTRUCT A SAFE UPDATE OBJECT ---
    // This approach prevents overwriting the entire settings object.
    // It's more like a PATCH, which is safer.
    const updateObject: { [key: string]: any } = {};
    for (const key in sanitizedSettings) {
        // Build a dot-notation path like 'settings.profileVisibility'
        updateObject[`settings.${key}`] = (sanitizedSettings as any)[key];
    }

    if (Object.keys(updateObject).length === 0) {
        return NextResponse.json({ message: "No valid settings provided to update." }, { status: 400 });
    }

    const result = await users.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: updateObject }
    );

    await cacheDel(`user:profile:${user.username}`);

    return NextResponse.json({ message: 'Settings updated successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}