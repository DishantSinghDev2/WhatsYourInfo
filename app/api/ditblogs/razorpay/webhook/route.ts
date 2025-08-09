import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { dispatchInternalWebhook } from '@/lib/internal-webhooks';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // 1. Verify the signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Process the event
    const event = JSON.parse(body);
    const { payload } = event;
    const { subscription } = payload;
    const userId = new ObjectId(subscription.entity.notes.userId);
    const planId = subscription.entity.plan_id;

    // A simple mapping from Razorpay plan ID back to your plan names
    // You should make this more robust based on your actual IDs
    const plan = planId.includes('growth') ? 'GROWTH' : 'SCALE'; 

    const db = (await clientPromise).db('whatsyourinfo');
    const updatePayload = {
        plan,
        provider: 'razorpay',
        status: subscription.entity.status, // e.g., 'active', 'cancelled'
        subscriptionId: subscription.entity.id,
    };
    
    // 3. Update the ditSub collection
    await db.collection('ditSub').updateOne(
        { userId },
        { $set: { ditblogs: updatePayload } },
        { upsert: true }
    );
    
    // 4. Dispatch internal webhook
    await dispatchInternalWebhook('ditblogs', 'plan.changed', { userId, ...updatePayload });

    return NextResponse.json({ status: 'ok' });
}