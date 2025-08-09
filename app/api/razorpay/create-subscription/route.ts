import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import Razorpay from 'razorpay';

// Initialize Razorpay with your credentials
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

    // --- START OF NEW LOGIC ---

    // 1. Calculate the trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // 2. Convert the trial end date to a UNIX timestamp (in seconds)
    // This is the `start_at` value.
    const startAtTimestamp = Math.floor(trialEndDate.getTime() / 1000);

    // 3. Define the subscription options
    const options: {
      plan_id: string;
      total_count?: number; // Optional, for perpetual subscriptions
      quantity: number;
      start_at: number; // Add the start_at field
      customer_notify: number;
      notes: Record<string, string>;
    } = {
      plan_id,
      quantity: 1,
      start_at: startAtTimestamp, // Tell Razorpay when to start billing
      customer_notify: 1,
      notes: {
          userId: user._id.toString(),
          email: user.email,
          product: 'WYI_PRO'
      }
    };

    // 4. For perpetual monthly billing, we OMIT the `total_count`.
    // For yearly plans, we set it to 1, as it's a single charge for the year.

    // --- END OF NEW LOGIC ---

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