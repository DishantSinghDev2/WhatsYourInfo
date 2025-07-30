// app/register/page.tsx
import { Suspense } from 'react';
import LoginPage from './LoginClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}