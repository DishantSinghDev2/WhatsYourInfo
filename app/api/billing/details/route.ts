import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getPayPalAccessToken, getPayPalApiBase } from '@/lib/paypal'; // Assuming you have this helper
import Razorpay from 'razorpay';
import clientPromise from '@/lib/mongodb';

// --- Provider-Specific Handlers ---

// Fetches details from PayPal for a given subscription ID
async function getPayPalDetails(subscriptionId: string) {
  try {
    const accessToken = await getPayPalAccessToken();
    const apiBase = getPayPalApiBase();
    const subResponse = await fetch(`${apiBase}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!subResponse.ok) return null;
    const subscription = await subResponse.json();

    const transactionsResponse = await fetch(`${apiBase}/v1/billing/subscriptions/${subscriptionId}/transactions?start_time=2020-01-01T00:00:00Z&end_time=${new Date().toISOString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!transactionsResponse.ok) return null; // Gracefully handle if transactions fail
    const transactionsData = await transactionsResponse.json();

    return {
      plan: {
        name: 'Pro Plan', // You can enhance this if you store plan names
        status: subscription.status.toLowerCase(),
        nextBillingDate: subscription.billing_info?.next_billing_time || null,
        isCanceling: subscription.status === 'CANCELLED',
        provider: 'paypal',
      },
      paymentMethod: {
        brand: 'PayPal',
        last4: '', // PayPal doesn't expose card details
      },
      billingHistory: (transactionsData.transactions || []).map((txn: any) => ({
        id: txn.id,
        date: new Date(txn.time),
        amount: txn.amount_with_breakdown?.gross_amount?.value,
        currency: txn.amount_with_breakdown?.gross_amount?.currency_code,
        status: txn.status.toLowerCase(),
      })),
    };
  } catch (error) {
    console.error(`Failed to fetch PayPal details for ${subscriptionId}:`, error);
    return null; // Return null on error to prevent crashing the whole endpoint
  }
}

// Fetches details from Razorpay for a given subscription ID
async function getRazorpayDetails(subscriptionId: string) {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // 1. Fetch the subscription details
    const subscription = await instance.subscriptions.fetch(subscriptionId);

    // --- FIX IS HERE ---
    // 2. Fetch all payments for that specific subscription ID
    const payments = await instance.payments.all({ subscription_id: subscriptionId });
    // --- END FIX ---

    return {
      plan: {
        name: 'Pro Plan', // You can enhance this
        status: subscription.status.toLowerCase(),
        nextBillingDate: new Date(subscription.charge_at * 1000),
        isCanceling: !!subscription.cancel_at,
        provider: 'razorpay',
      },
      paymentMethod: {
        brand: 'Razorpay', // Placeholder, you might get card details from payment entities if needed
        last4: '', // Razorpay doesn't expose this directly in sub details
      },
      billingHistory: (payments.items || []).map((p: any) => ({
        id: p.id,
        date: new Date(p.created_at * 1000),
        amount: (p.amount / 100).toFixed(2), // Convert from paise to rupees
        currency: p.currency,
        status: p.status,
      })),
    };
  } catch (error) {
    console.error(`Failed to fetch Razorpay details for ${subscriptionId}:`, error);
    return null; // Return null on error
  }
}

// --- Main Unified GET Handler ---
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = (await clientPromise).db('whatsyourinfo');
    const allBillingDetails: Record<string, any> = {};

    // --- 1. Fetch WYI Pro Subscription ---
    if (user.isProUser && user.subscriptionId) {
      if (user.subscriptionProvider === 'paypal') {
        allBillingDetails.wyi_pro = await getPayPalDetails(user.subscriptionId);
      } else if (user.subscriptionProvider === 'razorpay') {
        allBillingDetails.wyi_pro = await getRazorpayDetails(user.subscriptionId);
      }
    }

    // --- 2. Fetch DITBlogs & other subscriptions from ditSub collection ---
    const ditSub = await db.collection('ditSub').findOne({ userId: user._id });

    if (ditSub?.ditblogs?.subscriptionId) {
      if (ditSub.ditblogs.provider === 'paypal') {
        allBillingDetails.ditblogs = await getPayPalDetails(ditSub.ditblogs.subscriptionId);
      } else if (ditSub.ditblogs.provider === 'razorpay') {
        allBillingDetails.ditblogs = await getRazorpayDetails(ditSub.ditblogs.subscriptionId);
      }
      // Add a friendly name
      if (allBillingDetails.ditblogs) allBillingDetails.ditblogs.productName = 'DITBlogs';
    }

    // Add a friendly name for the main product
    if (allBillingDetails.wyi_pro) allBillingDetails.wyi_pro.productName = 'WhatsYour.Info Pro';

    // You can add more product fetches here (e.g., DITMail)

    return NextResponse.json(allBillingDetails);

  } catch (error) {
    console.error("Unified billing details fetch error:", error);
    return NextResponse.json({ error: 'Failed to retrieve billing information.' }, { status: 500 });
  }
}