// /workspace/WhatsYourInfo/app/api/paypal/create-subscription/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import client from '@/lib/paypal';
import paypal from '@paypal/checkout-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { yearly } = await request.json();

    const planId = yearly 
      ? process.env.PAYPAL_PRO_YEARLY_PLAN_ID 
      : process.env.PAYPAL_PRO_MONTHLY_PLAN_ID;

    if (!planId) {
        console.error('PayPal Plan ID is not configured in .env');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const subscriptionRequest = new paypal.subscriptions.SubscriptionsCreateRequest();
    subscriptionRequest.requestBody({
      plan_id: planId,
      custom_id: user._id.toString(), // Pass the user ID for tracking
      application_context: {
        brand_name: 'WhatsYourInfo',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?paypal_success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?paypal_cancel=true`,
      },
    });

    const response = await client.execute(subscriptionRequest);
    const subscription = response.result;

    // Find the approval link
    const approvalLink = subscription.links.find(link => link.rel === 'approve');

    if (!approvalLink) {
        throw new Error('Could not find PayPal approval link');
    }

    return NextResponse.json({ approvalUrl: approvalLink.href });

  } catch (error) {
    console.error('PayPal subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}