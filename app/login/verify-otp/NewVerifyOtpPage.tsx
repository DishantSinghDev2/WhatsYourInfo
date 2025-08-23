'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { KeyRound, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion'; // Import framer-motion

export default function NewVerifyOtpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

    // --- All original logic is preserved ---
    useEffect(() => {
        const emailFromQuery = searchParams.get('email');
        if (emailFromQuery) setEmail(emailFromQuery);
        else {
            toast.error('Email not found. Please try again.');
            router.push('/register');
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

    const classicViewUrl = `/login/verify-otp?view=classic&email=${email}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            >
                <Card className="w-full max-w-md shadow-xl">
                    <CardHeader className="text-center">
                        <KeyRound className="mx-auto h-10 w-10 text-blue-600" />
                        <CardTitle className="mt-4 text-2xl font-bold">Check your email</CardTitle>
                        <CardDescription>
                            We sent a 6-digit code to <br />
                            <span className="font-medium text-gray-800">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                            <div className="flex justify-center">
                                <InputOTP maxLength={6} value={otp} onChange={handleOtpChange}>
                                    <InputOTPGroup>
                                        {[...Array(6)].map((_, i) => <InputOTPSlot key={i} index={i} />)}
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 flex items-center justify-center text-center">
                                    <X className="h-4 w-4 mr-1 flex-shrink-0" /> {error}
                                </p>
                            )}

                            <Button type="submit" className="w-full text-base py-3" disabled={isLoading || otp.length < 6}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <p className="text-gray-500">
                                Didn't get a code?{' '}
                                <Button variant="link" onClick={handleOTPResend} className="p-0 h-auto font-medium" disabled={isResending}>
                                    {isResending ? 'Sending...' : 'Click to resend'}
                                </Button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            <div className="text-center mt-8">
                <Link href={classicViewUrl} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Switch to classic view
                </Link>
            </div>
        </>
    );
}