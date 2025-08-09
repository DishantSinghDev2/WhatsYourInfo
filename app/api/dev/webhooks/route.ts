import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import crypto from 'crypto';
import { dispatchWebhookEvent } from '@/lib/webhooks';

const webhookSchema = z.object({
  url: z.string().url({ message: "Invalid URL format." }),
  subscribedEvents: z.array(z.string()).min(1, "At least one event must be selected."),
});

// --- CREATE a new webhook ---
export async function POST(request: NextRequest) {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { clientId, ...webhookData } = await request.json();
    if (!clientId) return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });

    const validation = webhookSchema.safeParse(webhookData);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const newWebhook = {
        _id: new ObjectId(),
        url: validation.data.url,
        secret: `whsec_${crypto.randomBytes(32).toString('hex')}`,
        subscribedEvents: validation.data.subscribedEvents,
        status: 'active',
        createdAt: new Date(),
    };

    const db = (await clientPromise).db('whatsyourinfo');
    const result = await db.collection('oauth_clients').updateOne(
        { _id: new ObjectId(clientId), ownerId: user._id },
        { $push: { webhooks: newWebhook } }
    );

    if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Client not found or you do not have permission.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Webhook created successfully', webhook: newWebhook }, { status: 201 });
}

// --- UPDATE an existing webhook ---
export async function PATCH(request: NextRequest) {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { clientId, webhookId, ...updateData } = await request.json();
    if (!clientId || !webhookId) return NextResponse.json({ error: 'Client ID and Webhook ID are required' }, { status: 400 });
    
    const validation = webhookSchema.safeParse(updateData);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const db = (await clientPromise).db('whatsyourinfo');
    const result = await db.collection('oauth_clients').updateOne(
        { _id: new ObjectId(clientId), ownerId: user._id, 'webhooks._id': new ObjectId(webhookId) },
        { $set: { 
            'webhooks.$.url': validation.data.url,
            'webhooks.$.subscribedEvents': validation.data.subscribedEvents,
        }}
    );

    if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Webhook not found or permission denied.' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Webhook updated successfully.' });
}

// --- DELETE a webhook ---
export async function DELETE(request: NextRequest) {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const webhookId = searchParams.get('webhookId');

    if (!clientId || !webhookId) return NextResponse.json({ error: 'Client ID and Webhook ID are required' }, { status: 400 });
    
    const db = (await clientPromise).db('whatsyourinfo');
    const result = await db.collection('oauth_clients').updateOne(
        { _id: new ObjectId(clientId), ownerId: user._id },
        { $pull: { webhooks: { _id: new ObjectId(webhookId) } } }
    );

    if (result.modifiedCount === 0) {
        return NextResponse.json({ error: 'Webhook not found or permission denied.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Webhook deleted successfully.' });
}

// --- BONUS: A route for specific actions like pinging or regenerating secrets ---
export async function PUT(request: NextRequest) {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { clientId, webhookId, action } = await request.json();
    if (!clientId || !webhookId || !action) return NextResponse.json({ error: 'Client ID, Webhook ID, and Action are required' }, { status: 400 });
    
    const db = (await clientPromise).db('whatsyourinfo');
    const client = await db.collection('oauth_clients').findOne({ _id: new ObjectId(clientId), ownerId: user._id });
    if (!client) return NextResponse.json({ error: 'Client not found or permission denied' }, { status: 404 });
    
    const webhook = client.webhooks.find((wh: WebhookEndpoint) => wh._id.toString() === webhookId);
    if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });

    if (action === 'regenerate_secret') {
        const newSecret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
        await db.collection('oauth_clients').updateOne(
            { _id: client._id, 'webhooks._id': new ObjectId(webhookId) },
            { $set: { 'webhooks.$.secret': newSecret } }
        );
        return NextResponse.json({ message: 'Secret regenerated', newSecret });
    }

    if (action === 'ping') {
        await dispatchWebhookEvent('user.connected', user._id, {
          test_event: true,
          message: "Ping from WhatsYour.Info!",
          user: { id: user._id, username: user.username },
        });
        return NextResponse.json({ message: 'Test ping sent successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}