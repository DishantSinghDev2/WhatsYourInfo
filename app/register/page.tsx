// app/register/page.tsx
import { Suspense } from 'react';
import RegisterPage from './RegisterClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="justify-center flex h-screen items-center">Loading...</div>}>
      <RegisterPage />
    </Suspense>
  );
}