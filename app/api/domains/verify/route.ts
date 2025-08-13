import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import dns from 'dns/promises'; // --- (1) IMPORT NODE'S NATIVE DNS MODULE ---
import DOMPurify from 'isomorphic-dompurify'; // --- (2) IMPORT THE SANITIZER ---

// --- (3) STRENGTHEN THE ZOD SCHEMA ---
const verifyDomainSchema = z.object({
  domain: z.string()
    .trim() // Remove leading/trailing whitespace
    .min(1, 'Domain is required')
    // A basic regex to check for a valid domain-like format.
    // This is not foolproof but prevents obviously invalid inputs.
    .refine(
      (value) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
      { message: 'Invalid domain format' }
    ),
});


export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !user.isProUser) {
      return NextResponse.json(
        { error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = verifyDomainSchema.parse(body);

    // --- (4) SANITIZE THE DOMAIN NAME ---
    // Clean the domain to prevent Stored XSS before it's used or stored.
    const sanitizedDomain = DOMPurify.sanitize(validatedData.domain);
    const verificationCode = `whatsyour-info-verification=${user._id}`;

    // --- (5) USE THE NATIVE DNS MODULE FOR VERIFICATION ---
    try {
      const records = await dns.resolveTxt(sanitizedDomain);
      // resolveTxt returns an array of arrays, e.g., [['record1'], ['record2-part1', 'record2-part2']]
      // We flatten it and check if any record part includes our code.
      const isVerified = records.flat().some(record =>
        record.includes(verificationCode)
      );

      if (!isVerified) {
        return NextResponse.json({
            error: 'Domain verification failed. TXT record not found.',
            verificationCode,
            instructions: `Please add a TXT record to '${sanitizedDomain}' with the following value: ${verificationCode}`
          },
          { status: 400 }
        );
      }

      // --- (6) STORE THE SANITIZED DOMAIN ---
      const client = await clientPromise;
      const db = client.db('whatsyourinfo');
      await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        {
          $set: {
            customDomain: sanitizedDomain, // Store the clean domain
            domainVerified: true,
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        message: 'Domain verified successfully',
        domain: sanitizedDomain
      });

    } catch (dnsError: any) {
      // Handle specific DNS errors, e.g., domain not found.
      if (dnsError.code === 'ENOTFOUND' || dnsError.code === 'ENODATA') {
        return NextResponse.json({
            error: `Could not find the domain '${sanitizedDomain}' or it has no TXT records.`,
            verificationCode
          },
          { status: 404 }
        );
      }
      // For other DNS errors, log and return a generic error.
      console.error('DNS lookup failed:', dnsError);
      return NextResponse.json(
        { error: 'An error occurred during DNS lookup.' },
        { status: 500 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Domain verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}