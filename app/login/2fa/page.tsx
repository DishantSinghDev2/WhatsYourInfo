'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import NewVerify2FAPage from './NewVerify2FAPage';
import ClassicVerify2FAPage from './ClassicVerify2FAPage';
import { Loader2 } from 'lucide-react';

function TwoFactorViewSwitcher() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  if (view === 'classic') {
    return <ClassicVerify2FAPage />;
  }
  
  return <NewVerify2FAPage />;
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-blue-600" />}>
      <TwoFactorViewSwitcher />
    </Suspense>
  );
}