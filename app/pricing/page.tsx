// app/register/page.tsx
import { Suspense } from 'react';
import PricingPage from './PricingClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="justify-center flex h-screen items-center">Loading...</div>}>
      <PricingPage />
    </Suspense>
  );
}