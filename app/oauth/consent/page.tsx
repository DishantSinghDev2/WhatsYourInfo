// app/register/page.tsx
import { Suspense } from 'react';
import ConsentPage from './ConcentClient';

export default function Register() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
      <ConsentPage />
    </Suspense>
  );
}