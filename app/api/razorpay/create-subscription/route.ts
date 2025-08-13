// app/api/razorpay/create-subscription-with-trial/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import Razorpay from 'razorpay';
import { z } from 'zod'; // --- (1) IMPORT ZOD ---

// Initialize Razorpay
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// --- (2) DEFINE A STRICT SCHEMA FOR THE REQUEST BODY ---
const subscriptionSchema = z.object({
  // Enforces that 'yearly' must be a boolean (true or false).
  yearly: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This is an excellent business logic check.
    if (user.isProUser) {
        const provider = user.subscriptionProvider || 'an existing';
        return NextResponse.json(
            { error: `You already have an active Pro subscription via ${provider}. Please manage it in your billing settings.` },
            { status: 409 }
        );
    }

    const body = await request.json();
    // --- (3) VALIDATE THE BODY AGAINST THE SCHEMA ---
    // This is the core security step. It ensures the input is exactly what we expect.
    const { yearly } = subscriptionSchema.parse(body);

    const plan_id = yearly
      ? process.env.RAZORPAY_PRO_YEARLY_PLAN_ID
      : process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID;

    if (!plan_id) {
      console.error('Razorpay Plan ID not set in .env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    const startAtTimestamp = Math.floor(trialEndDate.getTime() / 1000);

    const options = {
      plan_id,
      quantity: 1,
      start_at: startAtTimestamp,
      customer_notify: 1,
      total_count: yearly ? 1 : 60, // Logic is correct here
      notes: {
          userId: user._id.toString(),
          email: user.email,
          product: 'WYI_PRO'
      },
    };

    const subscription = await instance.subscriptions.create(options);
    
    return NextResponse.json({
        subscriptionId: subscription.id,
        keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    // --- (4) CATCH VALIDATION AND RAZORPAY ERRORS ---
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && 'isRazorpayError' in error) {
        return NextResponse.json({ error: (error as any).description || 'Payment gateway error.' }, { status: 500 });
    }
    console.error('Razorpay subscription creation with trial failed:', error);
    return NextResponse.json({ error: 'Failed to create subscription.' }, { status: 500 });
  }
}