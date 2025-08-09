import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { WebhookEndpoint } from '@/types';
import { ObjectId } from 'mongodb';
import { WebhookEvent } from '@/lib/constants';

export async function dispatchWebhookEvent(
  eventName: WebhookEvent,
  userId: ObjectId,
  payload: Record<string, any>
) {
  try {
    const db = (await clientPromise).db('whatsyourinfo');

    const authorizations = await db.collection('oauth_authorizations')
      .find({ userId })
      .project({ clientId: 1 })
      .toArray();

    if (authorizations.length === 0) return;

    const clientIds = authorizations.map(auth => auth.clientId);

    const clientsWithWebhooks = await db.collection('oauth_clients').find({
      _id: { $in: clientIds },
      'webhooks.status': 'active',
      'webhooks.subscribedEvents': eventName,
    }).project({ webhooks: 1 }).toArray();

    if (clientsWithWebhooks.length === 0) return;

    // --- START OF NEW LOGIC ---
    
    // 1. Create a unique ID for this specific event delivery.
    const eventId = `evt_${crypto.randomBytes(24).toString('hex')}`;

    const eventData = {
      id: eventId, // Include the new ID
      event: eventName,
      createdAt: new Date(), // Use a Date object for TTL index
      payload,
    };

    const body = JSON.stringify(eventData);

    // 2. Log the event to the database *before* sending.
    // This allows for API verification later.
    await db.collection('webhook_events').insertOne(eventData);
    
    // --- END OF NEW LOGIC ---

    const dispatchPromises: Promise<void>[] = [];

    for (const client of clientsWithWebhooks) {
      const relevantWebhooks = client.webhooks.filter(
        (wh: WebhookEndpoint) => wh.status === 'active' && wh.subscribedEvents.includes(eventName)
      );

      for (const webhook of relevantWebhooks) {
        // --- UPDATED SIGNATURE LOGIC ---
        // 3. Create the signature using the webhook's specific secret.
        const timestamp = Math.floor(Date.now() / 1000); // Current unix timestamp
        const signedPayload = `${timestamp}.${body}`; // Prepend timestamp to body for signing
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(signedPayload)
          .digest('hex');

        // 4. Construct the signature header string, including the timestamp.
        const signatureHeader = `t=${timestamp},v1=${signature}`;
        // --- END OF UPDATED SIGNATURE LOGIC ---

        dispatchPromises.push((async () => {
          try {
            await fetch(webhook.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              'WYI-Signature': signatureHeader,
              },
              body,
            });
          } catch (e) {
            console.error(`Webhook failed for URL ${webhook.url}:`, e);
          }
        })()
        );
      }
    }

    await Promise.all(dispatchPromises);

  } catch (error) {
    console.error('Failed to dispatch webhook event:', error);
  }
}