import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

// Schema to validate the incoming username for checking. The dot (.) has been removed.
const usernameCheckSchema = z.string()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username cannot exceed 20 characters" })
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, {
    message: "Username must start with a letter and can only contain letters, numbers, hyphens, and underscores."
  });

// --- NEW: List of reserved usernames that cannot be registered ---
const RESERVED_USERNAMES = new Set([
  // Authentication
  'login', 'logout', 'register', 'auth', 'signin', 'signout', 'verify-otp', 'reset-password',

  // Core App Routes
  'dashboard', 'settings', 'account', 'profile', 'analytics', 'admin', 'panel',

  // Common Subdomains & Technical terms
  'api', 'www', 'app', 'dev', 'staging', 'ftp', 'mail', 'smtp', 'pop', 'imap',

  // Informational Pages
  'about', 'contact', 'support', 'help', 'faq', 'docs', 'blog', 'news', 'press',
  
  // Legal
  'terms', 'privacy', 'legal', 'policy', 'terms-of-service',

  // E-commerce / Pro Features
  'pricing', 'billing', 'upgrade', 'pro', 'premium', 'shop', 'store',

  // Generic & Potentially Confusing
  'assets', 'static', 'media', 'download', 'search', 'explore', 'root', 'user', 'users',
  'whatsyourinfo', 'info', 'whatsyour', 'dit', 'ditmail', 'ditblogs', 'dishistech', 'dishistechnologies', 'dishistechnology', 'dishis-tech', 'dishis-technologies', 'dishis-technology', 'fce', 'git'
]);

/**
 * Generates a list of alternative username suggestions.
 */
async function getUsernameSuggestions(
  db: any,
  firstName: string,
  lastName: string,
  baseUsername: string
): Promise<string[]> {
  const suggestions: string[] = [];
  // --- (2) SANITIZE FIRST/LAST NAME BEFORE USE ---
  const sanitizedFirst = DOMPurify.sanitize(firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedLast = DOMPurify.sanitize(lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedBase = DOMPurify.sanitize(baseUsername || '');

  const potentialUsernames = [
    `${sanitizedFirst}${sanitizedLast}`,
    `${sanitizedFirst}_${sanitizedLast}`,
    `${sanitizedFirst}-${sanitizedLast}`,
    `${sanitizedLast}${sanitizedFirst}`,
    `${sanitizedBase}${Math.floor(Math.random() * 90) + 10}`,
    `${sanitizedBase}${new Date().getFullYear().toString().slice(-2)}`,
  ].filter(Boolean); // Filter out empty strings if names are empty

  const usersCollection = db.collection('users');
  for (const name of potentialUsernames) {
    if (suggestions.length >= 3) break;
    const trimmedName = name.slice(0, 20);
    if (RESERVED_USERNAMES.has(trimmedName)) continue;

    const existing = await usersCollection.findOne({ username: trimmedName });
    if (!existing) {
      suggestions.push(trimmedName);
    }
  }
  return suggestions;
}

export async function POST(request: NextRequest) {
  try {
    const { username, firstName, lastName } = await request.json();

    // 1. Validate the username format
    const validation = usernameCheckSchema.safeParse(username);
    if (!validation.success) {
      const message = validation.error.errors[0]?.message || 'Invalid username format.';
      return NextResponse.json({ available: false, message }, { status: 400 });
    }
    const validatedUsername = validation.data;

    // --- (3) SANITIZE THE VALIDATED USERNAME ---
    const sanitizedUsername = DOMPurify.sanitize(validatedUsername);

    // 2. Check against the reserved list
    if (RESERVED_USERNAMES.has(sanitizedUsername.toLowerCase())) {
      return NextResponse.json({
        available: false,
        message: 'This name is reserved and cannot be used.',
        suggestions: []
      }, { status: 409 });
    }

    // 3. Check database using the sanitized username
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    const existingUser = await db.collection('users').findOne({ username: sanitizedUsername });

    if (existingUser) {
      const suggestions = await getUsernameSuggestions(db, firstName, lastName, sanitizedUsername);
      return NextResponse.json({ available: false, message: 'This username is already taken.', suggestions });
    }

    return NextResponse.json({ available: true, message: 'Username is available!' });

  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
