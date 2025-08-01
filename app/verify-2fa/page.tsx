// app/verify-2fa/page.tsx

'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

// The main logic is in this component
function Verify2FAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // The temporary pre-auth token is passed from the login page
  const preAuthToken = searchParams.get('token');
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    const callback = searchParams.get('callbackUrl');
    if (callback) setCallbackUrl(callback);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preAuthToken) {
      toast.error("Your session has expired. Please log in again.");
      router.push('/login');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, preAuthToken })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      // Check if the original login attempt had a redirect URL
      const redirectUrl = searchParams.get('redirect') || callbackUrl || '/profile';
      // Use router.replace() to navigate, which won't add this page to the browser history
      router.replace(redirectUrl);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid or expired code.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="2fa-code" className="sr-only">Verification Code</label>
                <Input
                  id="2fa-code"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))} // Only allow digits
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="text-center text-2xl tracking-[0.5em]"
                />
              </div>
              <Button type="submit" disabled={isLoading || code.length < 6} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Use Suspense as a best practice for pages that rely on searchParams
export default function Verify2FAPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<div className="flex items-center justify-center pt-20"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
        <Verify2FAContent />
      </Suspense>
    </div>
  );
}