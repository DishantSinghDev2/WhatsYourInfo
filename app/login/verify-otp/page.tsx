'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Import the layout and page components
import LoginLayout from '../LoginLayout'; // Note the path is up one level
import NewVerifyOtpPage from './NewVerifyOtpPage';
import ClassicVerifyOtpPage from './ClassicVerifyOtpPage';

function OtpViewSwitcher() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  if (view === 'classic') {
    // Render classic view directly
    return <ClassicVerifyOtpPage />;
  }

  // Render new view inside the layout
  return (
    <LoginLayout>
      <NewVerifyOtpPage />
    </LoginLayout>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
      <OtpViewSwitcher />
    </Suspense>
  );
}