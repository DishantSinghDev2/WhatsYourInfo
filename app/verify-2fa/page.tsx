// app/verify-2fa/page.tsx
import { Suspense } from 'react';
import Verify2FAPage from './Verify2faClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="justify-center flex h-screen items-center">Loading...</div>}>
      <Verify2FAPage />
    </Suspense>
  );
}