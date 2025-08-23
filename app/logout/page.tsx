// app/logout/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * A dedicated page to handle user logout.
 * It shows a loading state, calls the logout API, and then redirects.
 */
export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // We start the API call and a minimum timer simultaneously.
        // This ensures the loader is visible for at least 500ms,
        // preventing a jarring flash if the API call is very fast.
        await Promise.all([
            fetch('/api/auth/logout', { method: 'POST' }),
            new Promise(resolve => setTimeout(resolve, 500)) 
        ]);

      } catch (error) {
        // Even if the API call fails (e.g., network error),
        // we still want to redirect the user to the login page.
        console.error('Logout request failed:', error);
      } finally {
        // Use router.replace so the user cannot navigate back to the logout page.
        // We also add a query param to show a success message on the login page.
        router.replace('/login?message=You have been signed out.');
      }
    };

    performLogout();
  }, [router]); // Dependency array ensures this runs only once on mount

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-gray-50">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Signing you out</h1>
        <p className="mt-1 text-center text-gray-600">Please wait a moment...</p>
      </div>
    </div>
  );
}