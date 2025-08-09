import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import Razorpay from 'razorpay';

// Initialize Razorpay with your credentials from .env.local
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

    const options = {
      plan_id,
      total_count: yearly ? 1 : 12, // Number of billing cycles for the subscription
      quantity: 1,
      customer_notify: 1, // Let Razorpay handle notifications
      notes: {
          userId: user._id.toString(),
          email: user.email,
          product: 'WYI_PRO'
      }
    };

    // Create the subscription on Razorpay's servers
    const subscription = await instance.subscriptions.create(options);
    
    // Return the subscription ID and your public key ID to the frontend
    return NextResponse.json({
        subscriptionId: subscription.id,
        keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error('Razorpay subscription creation failed:', error);
    // Check if it's a Razorpay-specific error
    if (error instanceof Error && 'isRazorpayError' in error) {
        return NextResponse.json({ error: (error as any).description || 'Payment gateway error.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create subscription.' }, { status: 500 });
  }
}