// app/pricing/page.tsx
import { Suspense } from 'react';
import PricingPage from './PricingClient';
import Script from 'next/script';
import { headers } from 'next/headers';

export default async function Pricing() {
  const nonce = (await headers()).get('x-nonce');

  return (
    <>
      {nonce && (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
          nonce={nonce}
        />
      )}

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen w-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <PricingPage />
      </Suspense>
    </>
  );
}
