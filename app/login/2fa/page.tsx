'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Import the layout and page components
import LoginLayout from '../LoginLayout'; // Note the path is up one level
import NewVerify2FAPage from './NewVerify2FAPage';
import ClassicVerify2FAPage from './ClassicVerify2FAPage';

function TwoFactorViewSwitcher() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  if (view === 'classic') {
    // Render classic view directly
    return <ClassicVerify2FAPage />;
  }
  
  // Render new view inside the layout
  return (
    <LoginLayout>
      <NewVerify2FAPage />
    </LoginLayout>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
      <TwoFactorViewSwitcher />
    </Suspense>
  );
}