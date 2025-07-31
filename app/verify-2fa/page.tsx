// app/verify-2fa/page.tsx

'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function Verify2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // The temporary token is passed via URL search params from the login form
  const preAuthToken = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preAuthToken) {
        toast.error("Invalid session. Please log in again.");
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
        if(!res.ok) throw new Error(data.error);

        toast.success("Login successful!");
        router.push('/dashboard'); // Verification complete, redirect to dashboard
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Invalid code.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    // Your standard page layout
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center">Two-Factor Authentication</h2>
        <p className="text-center text-gray-600 mt-2">Enter the 6-digit code from your authenticator app.</p>
        <div className="mt-6">
          <Input value={code} onChange={e => setCode(e.target.value)} placeholder="123456" maxLength={6} required />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full mt-4">
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      </form>
    </div>
  );
}