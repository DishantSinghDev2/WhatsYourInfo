import paypal from '@paypal/checkout-server-sdk';

const configureEnvironment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';

  if (process.env.NODE_ENV === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
};

const client = new paypal.core.PayPalHttpClient(configureEnvironment());

export default client;

// lib/paypal.ts

// A simple in-memory cache for the access token
let tokenCache = {
  accessToken: '',
  expiresAt: 0,
};

/**
 * Returns the correct base URL for the PayPal API based on the environment.
 */
export function getPayPalApiBase(): string {
  return process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

/**
 * Fetches a PayPal access token, using a short-lived cache to improve performance.
 */
export async function getPayPalAccessToken(): Promise<string> {
  // If we have a valid, non-expired token in cache, return it
  if (tokenCache.accessToken && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal client ID or secret is not configured.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const apiBase = getPayPalApiBase();

  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('PayPal token fetch failed:', errorBody);
    throw new Error('Could not authenticate with PayPal.');
  }

  const data = await response.json();
  
  // Cache the token. expires_in is in seconds.
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // Refresh 5 mins before expiry
  };

  return data.access_token;
}