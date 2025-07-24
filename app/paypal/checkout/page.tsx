'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PayPalCheckoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderID = searchParams.get('orderID');
  const clientID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  useEffect(() => {
    if (!orderID) {
      router.push('/pricing');
    }
  }, [orderID, router]);

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <PayPalScriptProvider options={{ 'client-id': clientID, intent: 'subscription', vault: true }}>
        <PayPalButtons
          createSubscription={(data, actions) => {
            return actions.subscription.create({
              plan_id: 'YOUR_PAYPAL_PLAN_ID' // IMPORTANT: Create this in your PayPal developer dashboard
            });
          }}
          onApprove={async (data, actions) => {
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID }),
            });
            const details = await res.json();
            if (details.success) {
              router.push('/dashboard?success=true');
            } else {
              router.push('/pricing?canceled=true');
            }
          }}
          onError={(err) => {
            console.error('PayPal checkout error:', err);
            router.push('/pricing?canceled=true');
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
};

export default PayPalCheckoutPage;