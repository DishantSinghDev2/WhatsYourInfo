'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import LoginLayout from '../LoginLayout'; // Reusing the layout

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        if (!token) {
            toast.error("Invalid or missing reset token.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            toast.success("Password reset successfully! Please sign in.");
            router.replace('/login'); // Use replace to clear history

        } catch (error: any) {
            toast.error(error.message || "Failed to reset password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-gray-200 shadow-xl w-full">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Create New Password</CardTitle>
                <CardDescription>Choose a new, strong password for your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password">New Password</label>
                        <div className="relative">
                            <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={errors.password ? 'border-red-500' : ''} placeholder="8+ characters" />
                            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3"><Eye className="h-4 w-4 text-gray-400" /></button>
                        </div>
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>
                    <div>
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={errors.confirmPassword ? 'border-red-500' : ''} placeholder="••••••••" />
                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>
                    <Button type="submit" className="w-full text-base py-3" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Set New Password</Button>
                </form>
            </CardContent>
        </Card>
    );
}

// Main page component to wrap the form in Suspense and the layout
export default function ResetPasswordPage() {
    return (
        <LoginLayout>
            <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-blue-600" />}>
                <ResetPasswordForm />
            </Suspense>
        </LoginLayout>
    );
}