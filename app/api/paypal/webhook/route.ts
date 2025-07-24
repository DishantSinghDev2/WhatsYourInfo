// /workspace/WhatsYourInfo/app/api/paypal/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Handle different webhook events
    switch (event.event_type) {
      // Event when a subscription is activated (e.g., after successful trial)
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subscription = event.resource;
        const userId = subscription.custom_id;
        
        if (userId) {
          await db.collection('users').updateOne(
            { _id: userId },
            { 
              $set: { 
                isProUser: true,
                paypalSubscriptionId: subscription.id,
                updatedAt: new Date()
              }
            }
          );
        }
        break;
      }

      // Event when a user cancels their subscription
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscription = event.resource;
        await db.collection('users').updateOne(
          { paypalSubscriptionId: subscription.id },
          { 
            $set: { 
              isProUser: false,
              updatedAt: new Date()
            },
            $unset: {
              paypalSubscriptionId: 1
            }
          }
        );
        break;
      }
    }

    // Respond to PayPal that the webhook was received successfully
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('PayPal Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}