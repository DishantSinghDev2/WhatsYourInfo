// app/register/page.tsx
import { Suspense } from 'react';
import LoginPage from './LoginClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="justify-center flex h-screen items-center">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}