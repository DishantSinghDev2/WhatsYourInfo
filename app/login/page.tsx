'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Import the new layout component and the page components
import LoginLayout from './LoginLayout'; 
import NewLoginPage from './NewLoginPage';
import ClassicLoginPage from './ClassicLoginPage';

function LoginViewSwitcher() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  if (view === 'classic') {
    // Render the classic page directly, WITHOUT the layout wrapper.
    return <ClassicLoginPage />;
  }

  // Render the new page explicitly wrapped in our LoginLayout component.
  return (
    <LoginLayout>
      <NewLoginPage />
    </LoginLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginViewSwitcher />
    </Suspense>
  );
}