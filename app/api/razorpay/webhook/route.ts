import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
    const secret = process.env.RAZORPAY_WYI_WEBHOOK_SECRET;
    if (!secret) {
        console.error('Razorpay webhook secret not configured in .env.local');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
    }

    // --- 1. Verify the Webhook Signature ---
    // This is the most critical step to ensure the request is from Razorpay.
    try {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(body);
        const digest = hmac.digest('hex');

        // Compare the generated signature with the one from the header
        if (digest !== signature) {
            console.warn('Invalid Razorpay webhook signature received.');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }
    } catch (error) {
        console.error('Error during signature verification:', error);
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 500 });
    }

    // --- 2. Process the Verified Event ---
    try {
        const event = JSON.parse(body);

        // We are primarily interested in events related to subscriptions
        if (event.entity !== 'event' || !event.payload.subscription) {
            return NextResponse.json({ status: 'ok', message: 'Event received, but not a subscription event. Acknowledged.' });
        }

        // Extract relevant information from the event payload
        const subscriptionEntity = event.payload.subscription.entity;
        const userId = subscriptionEntity.notes?.userId;
        const subscriptionId = subscriptionEntity.id;
        const status = subscriptionEntity.status; // e.g., "active", "completed", "cancelled"

        if (!userId) {
            console.error('Webhook received without a userId in notes.', subscriptionEntity);
            // Still return 200 so Razorpay doesn't retry, but log the issue.
            return NextResponse.json({ status: 'error', message: 'User ID missing in webhook payload.' });
        }

        const db = (await clientPromise).db('whatsyourinfo');
        const usersCollection = db.collection('users');

        // Prepare the update payload for the user document
        const updateData: {
            isProUser: boolean;
            paypalSubscriptionId?: string; // We'll use this field for any provider's ID
            subscriptionProvider?: 'razorpay' | 'paypal';
            subscriptionStatus?: string;
        } = {
            isProUser: false, // Default to false
            subscriptionProvider: 'razorpay',
            subscriptionId: subscriptionId,
            subscriptionStatus: status,
        };

        // --- 3. Update User Status Based on Event Type ---
        switch (event.event) {
            case 'subscription.activated':
            case 'subscription.charged':
            case 'subscription.resumed':
                updateData.isProUser = true;
                break;
            
            case 'subscription.cancelled':
            case 'subscription.halted':
            case 'subscription.paused':
            case 'subscription.completed': // This means the subscription term ended
                updateData.isProUser = false;
                break;
            
            default:
                // For other events we don't handle, just acknowledge them
                return NextResponse.json({ status: 'ok', message: `Event ${event.event} acknowledged but not processed.` });
        }

        // --- 4. Atomically Update the User in the Database ---
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );

        console.log(`Successfully processed '${event.event}' for user ${userId}. New pro status: ${updateData.isProUser}`);

        // Return a 200 OK response to Razorpay to acknowledge receipt
        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Error processing Razorpay webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}