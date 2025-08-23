'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import Link from 'next/link';

export default function ClassicVerify2FAPage() {
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



    const newViewUrl = `/login/2fa?token=${preAuthToken}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-sm space-y-6">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
                            <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* --- Form from original component --- */}
                                <Input id="2fa-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" maxLength={6} required className="text-center text-2xl tracking-[0.5em]" />
                                <Button type="submit" disabled={isLoading || code.length < 6} className="w-full">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <div className="text-center">
                        <Link href={newViewUrl} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            Switch to new view
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}