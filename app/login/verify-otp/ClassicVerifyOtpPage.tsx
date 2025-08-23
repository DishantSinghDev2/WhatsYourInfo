'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import Header from '@/components/Header';
import { KeyRound, X } from 'lucide-react';
import toast from 'react-hot-toast';

// This is your original component, preserved for the "classic" view.
export default function ClassicVerifyOtpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
    
    // --- All original logic is identical ---
    useEffect(() => {
        const emailFromQuery = searchParams.get('email');
        if (emailFromQuery) setEmail(emailFromQuery);
        else {
            toast.error('Email not found.');
            router.push('/register?view=classic');
        }
        const callback = searchParams.get('callbackUrl');
        if (callback) setCallbackUrl(callback);
    }, [searchParams, router]);

    const handleSubmit = async (currentOtp?: string) => {
        const code = currentOtp || otp;
        if (code.length !== 6) {
            setError('Please enter the complete 6-digit OTP.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: code }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Email verified successfully!');
                router.push(callbackUrl || '/profile');
            } else {
                setError(data.error || 'Invalid or expired OTP.');
                toast.error(data.error || 'OTP verification failed.');
                setOtp(''); // Clear OTP on failure
            }
        } catch {
            setError('A network error occurred. Please try again.');
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (value: string) => {
        setOtp(value);
        if (error) setError('');
        if (value.length === 6) {
            handleSubmit(value);
        }
    };

    const handleOTPResend = async () => {
        setIsResending(true);
        setError('');
        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) toast.success('A new OTP has been sent!');
            else throw new Error(data.error || 'Failed to resend OTP.');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsResending(false);
        }
    };
    const newViewUrl = `/login/verify-otp?email=${email}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex min-h-[calc(100vh-80px)] items-center justify-center py-12 px-4">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <KeyRound className="mx-auto h-12 w-12 text-blue-600" />
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Check your email</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            We've sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>.
                        </p>
                    </div>
                    <Card className="border-gray-200 shadow-lg">
                        <CardHeader><CardTitle>Enter your code</CardTitle><CardDescription>The code will expire shortly.</CardDescription></CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                                <div className="flex justify-center">
                                    <InputOTP maxLength={6} value={otp} onChange={handleOtpChange}>
                                        <InputOTPGroup>
                                            {[...Array(6)].map((_, i) => <InputOTPSlot key={i} index={i} />)}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                                {error && <p className="text-sm text-red-600 flex items-center justify-center"><X className="h-4 w-4 mr-1" />{error}</p>}
                                <Button type="submit" className="w-full" disabled={isLoading || otp.length < 6}>
                                    {isLoading ? 'Verifying...' : 'Verify'}
                                </Button>
                            </form>
                            <div className="mt-6 text-center text-sm">
                                <p className="text-gray-500">Didn't receive the email?{' '}
                                    <Button variant="link" onClick={handleOTPResend} className="p-0 h-auto" disabled={isLoading}>
                                        {isResending ? 'Sending...' : 'Resend OTP'}
                                    </Button>
                                </p>
                            </div>
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