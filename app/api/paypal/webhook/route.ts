import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    const mongoClient = await clientPromise;
    const db = mongoClient.db('whatsyourinfo');

    if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
      const subscriptionId = event.resource.id;
      await db.collection('users').updateOne(
        { paypalSubscriptionId: subscriptionId },
        {
          $set: {
            isProUser: false,
            updatedAt: new Date(),
          },
          $unset: {
            paypalSubscriptionId: 1,
          },
        }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}