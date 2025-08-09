import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import Razorpay from 'razorpay';

// Initialize Razorpay
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { yearly } = await request.json();
    const plan_id = yearly
      ? process.env.RAZORPAY_PRO_YEARLY_PLAN_ID
      : process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID;

    if (!plan_id) {
      console.error('Razorpay Plan ID not set in .env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // --- START OF THE CORRECTED LOGIC ---

    // 1. Calculate the trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    const startAtTimestamp = Math.floor(trialEndDate.getTime() / 1000);

    // 2. Define the subscription options object
    const options: {
      plan_id: string;
      total_count: number; // total_count is now mandatory
      quantity: number;
      start_at: number;
      customer_notify: number;
      notes: Record<string, string>;
    } = {
      plan_id,
      quantity: 1,
      start_at: startAtTimestamp,
      customer_notify: 1,
      notes: {
          userId: user._id.toString(),
          email: user.email,
          product: 'WYI_PRO'
      },
      // This is the key change to satisfy the API requirement
      total_count: 0 // Default value, will be overridden
    };

    // 3. Set total_count based on the plan type
    // To comply with Razorpay's API when a trial (`start_at`) is present,
    // we must provide a `total_count`.
    if (yearly) {
      // For a yearly plan with a trial, it's 1 charge after the trial.
      options.total_count = 1;
    } else {
      // For a monthly plan, we set a high number to simulate a perpetual subscription.
      // 60 cycles = 5 years. This is effectively "forever" for most SaaS subscriptions.
      // The user can cancel anytime.
      options.total_count = 60;
    }

    // --- END OF THE CORRECTED LOGIC ---

    // Create the subscription on Razorpay's servers
    const subscription = await instance.subscriptions.create(options);
    
    // Return the subscription ID and your public key ID to the frontend
    return NextResponse.json({
        subscriptionId: subscription.id,
        keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error('Razorpay subscription creation with trial failed:', error);
    if (error instanceof Error && 'isRazorpayError' in error) {
        return NextResponse.json({ error: (error as any).description || 'Payment gateway error.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create subscription.' }, { status: 500 });
  }
}