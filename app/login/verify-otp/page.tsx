'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import NewVerifyOtpPage from './NewVerifyOtpPage';
import ClassicVerifyOtpPage from './ClassicVerifyOtpPage';

function OtpViewSwitcher() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  if (view === 'classic') {
    return <ClassicVerifyOtpPage />;
  }

  // Render the new, animated component by default
  return <NewVerifyOtpPage />;
}

export default function VerifyOtpPage() {
  return (
    // Suspense is required when using useSearchParams at the page level
    <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-blue-600" />}>
      <OtpViewSwitcher />
    </Suspense>
  );
}