import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { dispatchInternalWebhook } from '@/lib/internal-webhooks'; // Assuming you have this


// --- Product-Specific Handler for WYI Pro ---
async function handleWyiSubscription(db: any, customData: any, resource: any) {
    const { status, id, next_billing_time } = resource;
    const isPro = status === 'ACTIVE';
    await db.collection('users').updateOne(
        { _id: new ObjectId(customData.userId) },
        {
            $set: {
                isProUser: isPro,
                subscriptionProvider: 'paypal',
                subscriptionId: id,
                subscriptionStatus: status,
                nextBillingDate: isPro ? new Date(next_billing_time) : null,
            },
        }
    );
    console.log(`Updated WYI_PRO status for user ${customData.userId} to ${isPro}`);
}
// --- Product-Specific Handler for DITBlogs ---
async function handleDitBlogsSubscription(db: any, customData: any, resource: any) {
    const { status, id, plan_id } = resource;
    const updatePayload = {
        plan: customData.plan_name,
        provider: 'paypal',
        status: status,
        subscriptionId: id,
        planId: plan_id,
    };
    await db.collection('ditSub').updateOne(
        { userId: new ObjectId(customData.userId) },
        { $set: { ditblogs: updatePayload } },
        { upsert: true }
    );
    await dispatchInternalWebhook('ditblogs', 'plan.changed', { userId: customData.userId, ...updatePayload });
    console.log(`Updated DITBLOGS status for user ${customData.userId}`);
}


// --- The Main Unified Webhook Router ---
export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    const event = JSON.parse(rawBody);
    // --- 1. Verify the Webhook Signature (Universal for all requests) ---
    // This logic is critical and remains unchanged.
    try {
        const verifyPayload = {
            auth_algo: headers['paypal-auth-algo'],
            cert_url: headers['paypal-cert-url'],
            transmission_id: headers['paypal-transmission-id'],
            transmission_sig: headers['paypal-transmission-sig'],
            transmission_time: headers['paypal-transmission-time'],
            webhook_id: process.env.PAYPAL_WEBHOOK_ID!,
            webhook_event: event,
        };

        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
        const apiBase = process.env.NODE_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        const tokenResp = await fetch(`${apiBase}/v1/oauth2/token`, {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'grant_type=client_credentials'
        });
        const { access_token: accessToken } = await tokenResp.json();

        const veResp = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyPayload),
        });
        const { verification_status } = await veResp.json();

        if (verification_status !== 'SUCCESS') {
            console.warn('PayPal signature invalid for event:', event.id);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }
    } catch (error) {
        console.error("PayPal webhook verification failed:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }

    // --- 2. Process the Verified Event ---
    try {
        const db = (await clientPromise).db('whatsyourinfo');
        const resource = event.resource;

        // --- 3. Parse the custom_id to get product and user info ---
        let customData;
        try {
            customData = JSON.parse(resource.custom_id);
        } catch (e) {
            // BACKWARD COMPATIBILITY: Handle old subscriptions that only had userId.
            console.warn(`Could not parse custom_id for subscription ${resource.id}. Assuming legacy WYI_PRO.`);
            customData = { userId: resource.custom_id, product: 'WYI_PRO' };
        }

        if (!customData || !customData.userId) {
            console.error('Webhook received without a parsable custom_id or userId.', resource);
            return NextResponse.json({ status: 'error', message: 'User ID missing in custom_id.' });
        }

        // We only care about subscription events
        if (!event.event_type.startsWith('BILLING.SUBSCRIPTION.')) {
            return NextResponse.json({ status: 'ok', message: 'Event acknowledged but not a subscription event.' });
        }

        // --- 4. Route to the appropriate handler ---
        switch (customData.product) {
            case 'WYI_PRO':
                await handleWyiSubscription(db, customData, resource);
                break;
            case 'DITBLOGS':
                await handleDitBlogsSubscription(db, customData, resource);
                break;
            // case 'DITMAIL':
            //     await handleDitMailSubscription(db, customData, resource);
            //     break;
            default:
                console.warn(`Webhook received for unknown product in custom_id: ${customData.product}`);
                break;
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Error processing unified PayPal webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
