// app/register/page.tsx
import { Suspense } from 'react';
import PricingPage from './PricingClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
      <PricingPage />
    </Suspense>
  );
}