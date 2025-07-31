// app/api/auth/verify-recovery-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const settingsUrl = new URL('/settings/security', request.nextUrl.origin);

  if (!token) {
    settingsUrl.searchParams.set('recovery_error', 'notoken');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Find the user by the token and check if it's expired
    const user = await db.collection('users').findOne({
      recoveryEmailToken: token,
      recoveryEmailExpires: { $gt: new Date() }
    });

    if (!user || !user.pendingRecoveryEmail) {
      settingsUrl.searchParams.set('recovery_error', 'invalid');
      return NextResponse.redirect(settingsUrl);
    }
    
    // --- Success: Finalize the change ---
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          recoveryEmail: user.pendingRecoveryEmail, // Set the final email
          recoveryEmailVerified: true,
          updatedAt: new Date(),
        },
        // Clean up all temporary fields
        $unset: {
          pendingRecoveryEmail: 1,
          recoveryEmailToken: 1,
          recoveryEmailExpires: 1,
        }
      }
    );
    
    settingsUrl.searchParams.set('recovery_success', 'true');
    return NextResponse.redirect(settingsUrl);

  } catch (error) {
    console.error("Verify recovery email error:", error);
    settingsUrl.searchParams.set('recovery_error', 'server');
    return NextResponse.redirect(settingsUrl);
  }
}