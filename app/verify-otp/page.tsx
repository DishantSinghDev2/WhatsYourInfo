// app/register/page.tsx
import { Suspense } from 'react';
import VerifyOtpPage from './VerifyOtpClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
      <VerifyOtpPage />
    </Suspense>
  );
}