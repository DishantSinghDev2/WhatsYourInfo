import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  const event = JSON.parse(rawBody);

  // Prepare PayPal verification payload
  const verifyPayload = {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: process.env.PAYPAL_WEBHOOK_ID!,
    webhook_event: event,
  };

  // Get access token manually
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const apiBase = process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const tokenResp = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const { access_token: accessToken } = await tokenResp.json();

  // Verify via PayPal API
  const veResp = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyPayload),
  });
  const { verification_status } = await veResp.json();

  if (verification_status !== 'SUCCESS') {
    console.warn('PayPal signature invalid');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // At this point, signature is valid, proceed to handle event
  const db = (await clientPromise).db('whatsyourinfo');
  switch (event.event_type) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      const sub = event.resource;
      const userId = sub.custom_id;
      if (userId) {
        await db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              isProUser: true,
              paypalSubscriptionId: sub.id,
              updatedAt: new Date(),
            },
          }
        );
      }
      break;
    }
    case 'BILLING.SUBSCRIPTION.CANCELLED':
      await db.collection('users').updateOne(
        { paypalSubscriptionId: event.resource.id },
        { $set: { isProUser: false, updatedAt: new Date() }, $unset: { paypalSubscriptionId: 1 } }
      );
      break;
  }

  return NextResponse.json({ received: true });
}
