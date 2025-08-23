'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { error } from 'console';

export default function NewVerify2FAPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('')

    const preAuthToken = searchParams.get('token');
    const callbackUrl = searchParams.get('callbackUrl');

    const handleSubmit = async (code?: string) => {
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


    const handleCodeChange = (value: string) => {
        setCode(value);
        if (error) setError('');
        if (value.length === 6) {
            handleSubmit(value);
        }
    };
    return (
        <>
            <Card className="border-gray-200 shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
                    <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                        <div>
                            <label htmlFor="2fa-code" className="sr-only">Verification Code</label>
                            <div className="flex justify-center">
                                <InputOTP maxLength={6}
                                    value={code}
                                    onChange={handleCodeChange}>
                                    <InputOTPGroup>
                                        {[...Array(6)].map((_, i) => <InputOTPSlot key={i} index={i} />)}
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
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