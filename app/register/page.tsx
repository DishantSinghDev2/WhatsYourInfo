// app/register/page.tsx
import { Suspense } from 'react';
import RegisterPage from './RegisterClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
      <RegisterPage />
    </Suspense>
  );
}