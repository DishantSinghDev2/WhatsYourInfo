// app/api/billing/details/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getPayPalAccessToken, getPayPalApiBase } from '@/lib/paypal';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    // Assumes the subscription ID is stored on the user model
    if (!user || !user.isProUser || !user.paypalSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 404 });
    }

    const accessToken = await getPayPalAccessToken();
    const apiBase = getPayPalApiBase();

    // --- 1. Fetch Subscription Details ---
    const subResponse = await fetch(`${apiBase}/v1/billing/subscriptions/${user.paypalSubscriptionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!subResponse.ok) throw new Error('Subscription not found on PayPal.');
    const subscription = await subResponse.json();

    // --- 2. Fetch Transaction History ---
    const transactionsResponse = await fetch(`${apiBase}/v1/billing/subscriptions/${user.paypalSubscriptionId}/transactions?start_time=2020-01-01T00:00:00Z&end_time=${new Date().toISOString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const transactionsData = await transactionsResponse.json();
    
    // --- 3. Format Data for Frontend ---
    const billingDetails = {
      plan: {
        name: 'Pro Plan',
        status: subscription.status.toLowerCase(), // e.g., 'active', 'cancelled'
        nextBillingDate: subscription.billing_info?.next_billing_time || null,
        isCanceling: subscription.status === 'CANCELLED',
      },
      paymentMethod: {
        brand: 'PayPal', // PayPal is always the source
        last4: user.email, // Show user's email as identifier
      },
      billingHistory: (transactionsData.transactions || []).map((txn: any) => ({
        id: txn.id,
        date: new Date(txn.time),
        amount: txn.amount_with_breakdown?.gross_amount?.value,
        status: txn.status.toLowerCase(),
        url: null, // PayPal API doesn't provide a direct invoice URL here
      })),
    };

    return NextResponse.json(billingDetails);

  } catch (error) {
    console.error("PayPal billing details fetch error:", error);
    return NextResponse.json({ error: 'Failed to retrieve billing information.' }, { status: 500 });
  }
}