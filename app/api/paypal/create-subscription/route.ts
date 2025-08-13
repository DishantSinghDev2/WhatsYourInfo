// /workspace/WhatsYourInfo/app/api/paypal/create-subscription/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { z } from 'zod'; // --- (1) IMPORT ZOD ---

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

    const body = await request.json();
    // --- (3) VALIDATE THE BODY AGAINST THE SCHEMA ---
    // If validation fails, this will throw an error and be caught below.
    const { yearly } = subscriptionSchema.parse(body);

    const planId = yearly
      ? process.env.PAYPAL_PRO_YEARLY_PLAN_ID
      : process.env.PAYPAL_PRO_MONTHLY_PLAN_ID;

    if (!planId) {
      console.error('PayPal Plan ID not set in .env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // === 1. Fetch access token manually (Unchanged) ===
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error('PayPal credentials missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const apiBase = process.env.NODE_ENV === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const tokenResp = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      console.error('PayPal token fetch failed:', tokenResp.status, text);
      return NextResponse.json({ error: 'PayPal auth failed' }, { status: 500 });
    }

    const { access_token: accessToken } = await tokenResp.json();
    if (!accessToken) {
      console.error('Missing access_token in PayPal response');
      return NextResponse.json({ error: 'PayPal auth failed' }, { status: 500 });
    }

    // === 2. Create subscription via REST API (Unchanged) ===
    const subResp = await fetch(`${apiBase}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': user._id.toString(),
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: user._id.toString(), // custom_id is server-controlled, which is secure
        application_context: {
          brand_name: 'WhatsYour.Info',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?paypal_success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?paypal_cancel=true`,
        },
      }),
    });

    if (!subResp.ok) {
      const text = await subResp.text();
      console.error('PayPal subscription API failed:', subResp.status, text);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    const subscription = await subResp.json();
    const approvalLink = (subscription.links || []).find((l: {rel: string}) => l.rel === 'approve');
    if (!approvalLink) {
      console.error('Approval link missing in PayPal response', subscription);
      return NextResponse.json({ error: 'Approval link not found' }, { status: 500 });
    }

    return NextResponse.json({ approvalUrl: approvalLink.href });

  } catch (err) {
    // --- (4) CATCH VALIDATION ERRORS FROM ZOD ---
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: err.errors },
        { status: 400 }
      );
    }
    console.error('Subscription creation exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}