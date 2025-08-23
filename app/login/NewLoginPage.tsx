'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function NewLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [view, setView] = useState<'login' | 'forgot-password'>('login');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(false);

    // All original logic is preserved...
    useEffect(() => {
        const callback = searchParams.get('callbackUrl');
        setCallbackUrl(callback);
        if (!callback) return;
        const fetchAuthStatus = async () => {
            setPageLoading(true);
            try {
                const res = await fetch('/api/oauth/user');
                if (res.ok) {
                    const user = await res.json();
                    if (user._id) router.push(callback);
                    else setPageLoading(false);
                } else setPageLoading(false);
            } catch (err) {
                toast.error('Auth check failed.');
                setPageLoading(false);
            }
        };
        fetchAuthStatus();
    }, [searchParams, router]);

    useEffect(() => {
        const message = searchParams.get('message');
        if (message) toast.success(message);
    }, [searchParams]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                if (data.emailVerified === false) {
                    toast.error("Email not verified. Please verify your email.");
                    router.push(`/verify-otp?${callbackUrl ? `callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`);
                    return;
                }
                toast.success('Login successful!');
                if (data.twoFactorRequired) {
                    // --- MODIFIED REDIRECT ---
                    // Now points to /login/2fa, preserving the callbackUrl
                    const callbackQuery = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : '';
                    router.push(`/login/2fa?token=${data.preAuthToken}${callbackQuery}`);
                    return;
                }
                else {
                    router.push(callbackUrl || '/profile');
                }
            } else {
                toast.error(data.error || 'Login failed');
                if (data.details) {
                    const fieldErrors: Record<string, string> = {};
                    data.details.forEach((detail: { path: string[]; message: string; }) => {
                        fieldErrors[detail.path[0]] = detail.message;
                    });
                    setErrors(fieldErrors);
                }
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            {view === 'login' ? (
                <Card className="border-gray-200 shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back</CardTitle>
                        <CardDescription>Sign in to continue to your dashboard</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* --- Form inputs and buttons --- */}
                            <div>
                                <label htmlFor="email">Email Address</label>
                                <Input id="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="password">Password</label>
                                <Input id="password" type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} />
                            </div>
                            <div className="text-sm text-right">
                                <button type="button" onClick={() => setView('forgot-password')} className="font-medium text-blue-600 hover:text-blue-500">Forgot your password?</button>
                            </div>
                            <Button type="submit" className="w-full text-base py-3" disabled={isLoading}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>
                        <div className="mt-6 text-center text-sm">
                            <span className="text-gray-500">Don't have an account? </span>
                            <Link href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="font-medium text-blue-600 hover:text-blue-500">
                                Create one
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <ForgotPasswordForm onBackToLogin={() => setView('login')} />
            )}

            <div className="text-center mt-8">
                <Link href={`/login?view=classic${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Switch to classic view
                </Link>
            </div>
        </>
    );
}