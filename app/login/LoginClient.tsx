'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Import the two different login page components
import NewLoginPage from './NewLoginPage';
import ClassicLoginPage from './ClassicLoginPage';

/**
 * This component reads the URL search parameters to decide which login view to render.
 */
function LoginViewSwitcher() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  // If the URL is /login?view=classic, show the original page.
  if (view === 'classic') {
    return <ClassicLoginPage />;
  }

  // By default, render the new, modern login experience.
  return <NewLoginPage />;
}

/**
 * The main component for the /login route.
 * It wraps the view switcher in a Suspense boundary, which is a best practice
 * when using useSearchParams at the page level.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen w-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <LoginViewSwitcher />
    </Suspense>
  );
}