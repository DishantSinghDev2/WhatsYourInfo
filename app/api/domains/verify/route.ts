import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const verifyDomainSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
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
    const { domain } = verifyDomainSchema.parse(body);

    // Verify domain ownership by checking DNS records
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
      const dnsData = await response.json();
      
      const verificationCode = `whatsyour-info-verification=${user._id}`;
      const isVerified = dnsData.Answer?.some((record: any) => 
        record.data.includes(verificationCode)
      );

      if (!isVerified) {
        return NextResponse.json(
          { 
            error: 'Domain verification failed',
            verificationCode,
            instructions: `Add this TXT record to your domain: ${verificationCode}`
          },
          { status: 400 }
        );
      }

      // Update user with verified domain
      const client = await clientPromise;
      const db = client.db('whatsyourinfo');

      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { 
            customDomain: domain,
            domainVerified: true,
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        message: 'Domain verified successfully',
        domain
      });

    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to verify domain' },
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