'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import Header from '@/components/Header';
import { CheckCircle, KeyRound, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyOtpPage() {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');

    const fetchUser = async () => {
        try {
            const response = await fetch('/api/auth/user')
            const data = await response.json()
            if (response.ok) {
                if (data.user.emailVerified) {
                    router.push('/dashboard')
                }
                setEmail(data.user.email)
            }
        } catch {
            // Handle case where email is not in the query parameters
            toast.error('Email not found. Please try registering again.');
            router.push('/register');
        }
    }


    useEffect(() => {
        fetchUser();
    }, [router]);

    const handleOtpChange = (value: string) => {
        setOtp(value);
        if (error) {
            setError('');
        }
    };

    const handleOTPResend = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('OTP resent successfully!');
            } else {
                setError(data.error || 'Failed to resend OTP.');
                toast.error(data.error || 'OTP resend failed.');
                router.push('/login')
            }
        } catch (error) {
            toast.error(error.message)
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter the complete 6-digit OTP.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/login?message=Email verified. Please sign in.');
            } else {
                setError(data.error || 'Invalid or expired OTP. Please try again.');
                toast.error(data.error || 'OTP verification failed.');
            }
        } catch (error) {
            setError('A network error occurred. Please try again.');
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (otp.length === 6) {
            handleSubmit();
        }
    }, [otp]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="flex min-h-[calc(100vh-80px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <KeyRound className="mx-auto h-12 w-12 text-blue-600" />
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                            Check your email
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            We've sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>.
                        </p>
                    </div>

                    <Card className="border-gray-200 shadow-lg">
                        <CardHeader>
                            <CardTitle>Enter your code</CardTitle>
                            <CardDescription>
                                The code will expire shortly, so please enter it soon.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex justify-center">
                                    <InputOTP
                                        maxLength={6}
                                        value={otp}
                                        onChange={handleOtpChange}
                                    >
                                        <InputOTPGroup className=''>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600 flex items-center justify-center">
                                        <X className="h-4 w-4 mr-1" />
                                        {error}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading || otp.length !== 6}
                                >
                                    {isLoading ? 'Verifying...' : 'Verify'}
                                </Button>
                            </form>

                            <div className="mt-6 text-center text-sm">
                                <p className="text-gray-500">
                                    Didn't receive the email?{' '}
                                    <Button variant="link" onClick={handleOTPResend} className="p-0 h-auto" disabled={isLoading}>
                                        Resend OTP
                                    </Button>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-center">
                        <Link href="/login">
                            <Button variant="ghost" className="text-sm text-gray-600">
                                ← Back to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}