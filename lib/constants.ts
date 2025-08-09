export const AVAILABLE_WEBHOOK_EVENTS = [
  {
    event: 'profile.updated',
    description: 'Fires whenever a user updates their profile information (e.g., name, bio).',
  },
  {
    event: 'user.connected',
    description: 'Fires when a new user authorizes your application for the first time.',
  },
  {
    event: 'user.revoked',
    description: 'Fires when a user revokes your application\'s access.',
  },
  // Add more events here in the future, e.g., 'link.created', 'gallery.added'
] as const; // 'as const' makes the strings literal types

// Create a type from the events
type WebhookEventTuple = typeof AVAILABLE_WEBHOOK_EVENTS;
export type WebhookEvent = WebhookEventTuple[number]['event'];