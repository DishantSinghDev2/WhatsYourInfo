import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import Razorpay from 'razorpay';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod'; // --- (1) IMPORT ZOD ---

const planMap = {
  GROWTH: {
    monthly: process.env.RAZORPAY_DITBLOGS_GROWTH_MONTHLY_PLAN_ID,
    yearly: process.env.RAZORPAY_DITBLOGS_GROWTH_YEARLY_PLAN_ID,
  },
  SCALE: {
    monthly: process.env.RAZORPAY_DITBLOGS_SCALE_MONTHLY_PLAN_ID,
    yearly: process.env.RAZORPAY_DITBLOGS_SCALE_YEARLY_PLAN_ID,
  },
};

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// --- (2) DEFINE A STRICT SCHEMA FOR THE REQUEST BODY ---
const subscriptionSchema = z.object({
    // Enforces that 'plan' must be exactly 'GROWTH' or 'SCALE'
    plan: z.enum(['GROWTH', 'SCALE']),
    // Enforces that 'yearly' must be a boolean
    yearly: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // --- START: Check for Existing Active Subscription (Unchanged) ---
    const db = (await clientPromise).db('whatsyourinfo');
    const existingDitSub = await db.collection('ditSub').findOne({ userId: user._id });

    if (existingDitSub?.ditblogs && ['active', 'activated'].includes(existingDitSub.ditblogs.status)) {
        const provider = existingDitSub.ditblogs.provider || 'an existing';
        return NextResponse.json(
            { error: `You already have an active DITBlogs subscription via ${provider}.` },
            { status: 409 }
        );
    }
    // --- END: Check for Existing Active Subscription ---

    const body = await request.json();
    // --- (3) VALIDATE THE BODY AGAINST THE SCHEMA ---
    // If validation fails, it throws an error that is caught below.
    const { plan, yearly } = subscriptionSchema.parse(body);

    // This lookup is now guaranteed to work with safe, validated data.
    const plan_id = planMap[plan][yearly ? 'yearly' : 'monthly'];
    if (!plan_id) {
        // This error would now only happen if an env var is missing, not due to bad user input.
        return NextResponse.json({ error: 'Plan configuration not found.' }, { status: 400 });
    }

    const options = {
      plan_id,
      total_count: yearly ? 1 : 60,
      quantity: 1,
      customer_notify: 1,
      notes: {
          userId: user._id.toString(),
          email: user.email,
          plan_name: plan, // It's safe to add the validated plan name here for your records
      }
    };

    const subscription = await instance.subscriptions.create(options);
    return NextResponse.json({
        subscriptionId: subscription.id,
        keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    // --- (4) CATCH VALIDATION ERRORS FROM ZOD ---
    if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
    }
    console.error('Razorpay subscription creation failed:', error);
    return NextResponse.json({ error: 'Failed to create subscription.' }, { status: 500 });
  }
}