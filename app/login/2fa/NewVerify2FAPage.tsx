'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewVerify2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const preAuthToken = searchParams.get('token');
  const callbackUrl = searchParams.get('callbackUrl');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preAuthToken) {
      toast.error("Session expired. Please log in again.");
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
      if (!res.ok) throw new Error(data.error || "Verification failed.");

      router.replace(callbackUrl || '/profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid or expired code.");
      setIsLoading(false);
    }
  };

  const classicViewUrl = `/login/2fa?view=classic&token=${preAuthToken}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;

  return (
    <>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="2fa-code" className="sr-only">Verification Code</label>
              <Input
                id="2fa-code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                maxLength={6}
                required
                className="text-center text-3xl tracking-[0.5em] py-6"
              />
            </div>
            <Button type="submit" disabled={isLoading || code.length < 6} className="w-full text-base py-3">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Verifying...' : 'Verify & Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="text-center mt-8">
        <Link href={classicViewUrl} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Switch to classic view
        </Link>
      </div>
    </>
  );
}