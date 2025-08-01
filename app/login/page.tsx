// app/register/page.tsx
import { Suspense } from 'react';
import LoginPage from './LoginClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen w-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>}>
      <LoginPage />
    </Suspense>
  );
}