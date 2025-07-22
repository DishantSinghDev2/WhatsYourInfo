import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import clientPromise from '@/lib/mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        
        if (userId) {
          await db.collection('users').updateOne(
            { _id: userId },
            { 
              $set: { 
                isProUser: true,
                stripeCustomerId: session.customer,
                subscriptionId: session.subscription,
                updatedAt: new Date()
              }
            }
          );
        }
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await db.collection('users').updateOne(
          { subscriptionId: subscription.id },
          { 
            $set: { 
              isProUser: false,
              updatedAt: new Date()
            },
            $unset: {
              subscriptionId: 1,
              stripeCustomerId: 1
            }
          }
        );
        break;
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}