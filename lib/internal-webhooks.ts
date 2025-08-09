import crypto from 'crypto';

/**
 * Dispatches a secure, internal webhook to your own services.
 * @param service The service that triggered the event (e.g., 'ditblogs').
 * @param event The event name (e.g., 'plan.changed').
 * @param payload The data associated with the event.
 */
export async function dispatchInternalWebhook(
    service: string,
    event: string,
    payload: Record<string, any>
) {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  const url = process.env.INTERNAL_WEBHOOK_URL;

  if (!secret || !url) {
    console.error('Internal webhook secret or URL not configured.');
    return;
  }

  const eventData = {
    service,
    event,
    payload,
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(eventData);
  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': signature,
      },
      body,
    });
  } catch (error) {
    console.error(`Failed to dispatch internal webhook for event ${event}:`, error);
  }
}