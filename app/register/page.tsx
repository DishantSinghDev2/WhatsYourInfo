'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import LoginLayout from '../login/LoginLayout'; // Reusing the same layout
import NewRegisterPage from './NewRegisterPage';
import ClassicRegisterPage from './ClassicRegisterPage';

function RegisterViewSwitcher() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  if (view === 'classic') {
    // Render the original single-page form directly
    return <ClassicRegisterPage />;
  }

  // // By default, render the new multi-step experience inside the shared layout
  return (
    <LoginLayout>
      <NewRegisterPage />
    </LoginLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterViewSwitcher />
    </Suspense>
  );
}
