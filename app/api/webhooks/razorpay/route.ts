import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { dispatchInternalWebhook } from '@/lib/internal-webhooks';
import { ObjectId } from 'mongodb';

// --- Product-Specific Handler for WYI Pro ---
async function handleWyiSubscription(db: any, userId: ObjectId, subscriptionData: any) {
  const { status, id } = subscriptionData;
  
  // --- KEY CHANGE HERE ---
  // Added 'authenticated' to the list. When a trial starts, the subscription
  // status becomes 'authenticated'. This ensures the user gets Pro access
  // immediately when their trial begins.
  const isPro = ['active', 'activated', 'resumed', 'authenticated'].includes(status);

  await db.collection('users').updateOne(
    { _id: userId },
    { $set: { 
        isProUser: isPro,
        subscriptionProvider: 'razorpay',
        subscriptionId: id,
        subscriptionStatus: status, // This will now correctly store 'authenticated'
      } 
    }
  );
  console.log(`Updated WYI_PRO status for user ${userId} to ${isPro} (status: ${status})`);
}

// --- Product-Specific Handler for DITBlogs ---
async function handleDitBlogsSubscription(db: any, userId: ObjectId, subscriptionData: any) {
  const { status, id, plan_id, notes } = subscriptionData;

  const updatePayload = {
    plan: notes.plan_name, // e.g., 'GROWTH' or 'SCALE'
    provider: 'razorpay',
    status: status,
    subscriptionId: id,
    planId: plan_id,
  };

  await db.collection('ditSub').updateOne(
    { userId: userId },
    { $set: { ditblogs: updatePayload } },
    { upsert: true }
  );
  
  // Also dispatch the internal webhook for DITBlogs
  await dispatchInternalWebhook('ditblogs', 'plan.changed', { userId, ...updatePayload });

  console.log(`Updated DITBLOGS status for user ${userId}`);
}

// --- The Main Webhook Router ---
export async function POST(request: NextRequest) {
    // 1. Verify the signature (universal for all requests to this endpoint)
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!; // Use one unified secret
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    try {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(body);
        const digest = hmac.digest('hex');
        if (digest !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 500 });
    }

    // 2. Process the verified event
    try {
        const event = JSON.parse(body);
        const subscriptionEntity = event.payload?.subscription?.entity;
        
        // Check if it's a valid subscription event with notes
        if (!subscriptionEntity?.notes?.product || !subscriptionEntity?.notes?.userId) {
            return NextResponse.json({ status: 'ok', message: 'Event acknowledged but no product or user found in notes.' });
        }

        const db = (await clientPromise).db('whatsyourinfo');
        const userId = new ObjectId(subscriptionEntity.notes.userId);

        // --- 3. Route the event to the correct handler based on the product tag ---
        switch (subscriptionEntity.notes.product) {
            case 'WYI_PRO':
                await handleWyiSubscription(db, userId, subscriptionEntity);
                break;
            case 'DITBLOGS':
                await handleDitBlogsSubscription(db, userId, subscriptionEntity);
                break;
            // case 'DITMAIL':
            //     await handleDitMailSubscription(db, userId, subscriptionEntity);
            //     break;
            default:
                console.warn(`Webhook received for unknown product: ${subscriptionEntity.notes.product}`);
                break;
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Error processing unified Razorpay webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}