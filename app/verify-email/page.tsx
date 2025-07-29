// app/verify-email/page.tsx

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// A wrapper component to access searchParams
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const errorFromUrl = searchParams.get('error');

    if (tokenFromUrl) {
      // If a token is in the URL, verify it automatically on load
      setStatus('verifying');
      setMessage('Verifying your email address...');
      // The GET endpoint handles the logic and redirects, so this component
      // primarily handles errors or manual entry.
    } else if (errorFromUrl) {
      setStatus('error');
      if (errorFromUrl === 'invalid_token') {
        setMessage('This verification link is invalid or has expired. Please request a new one.');
      } else {
        setMessage('An unexpected error occurred. Please try again later.');
      }
    }
  }, [searchParams]);

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput) {
      toast.error('Please enter your verification code.');
      return;
    }
    setStatus('verifying');
    setMessage('Verifying your code...');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setStatus('success');
      setMessage('Your email has been verified successfully!');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Verification failed.');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
        const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error);
        toast.success(data.message);
    } catch(error) {
        toast.error(error instanceof Error ? error.message : 'Could not resend email.');
    } finally {
        setIsResending(false);
    }
  };

  const renderStatus = () => {
    switch (status) {
      case 'verifying':
        return <div className="text-center space-y-4"><Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-600" /><p>{message}</p></div>;
      case 'success':
        return <div className="text-center space-y-4"><CheckCircle className="h-12 w-12 mx-auto text-green-600" /><p className="font-semibold">{message}</p><Button onClick={() => router.push('/login')}>Proceed to Login</Button></div>;
      case 'error':
        return <div className="text-center space-y-4"><XCircle className="h-12 w-12 mx-auto text-red-600" /><p className="font-semibold">{message}</p></div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {status !== 'idle' ? renderStatus() : (
              <form onSubmit={handleManualVerify} className="space-y-4">
                <p className="text-sm text-center text-gray-600">Please enter the code sent to your email or click the verification link.</p>
                <div>
                  <label htmlFor="token" className="sr-only">Verification Code</label>
                  <Input id="token" placeholder="Enter your verification code here" value={tokenInput} onChange={e => setTokenInput(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Verify Account</Button>
              </form>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Didn't receive an email?
                <Button variant="link" onClick={handleResend} disabled={isResending} className="font-semibold">
                    {isResending ? 'Sending...' : 'Resend Verification Link'}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Use Suspense to handle client-side rendering of searchParams
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="min-h-screen bg-gray-50">
                <Header />
                <VerifyEmailContent />
            </div>
        </Suspense>
    );
}