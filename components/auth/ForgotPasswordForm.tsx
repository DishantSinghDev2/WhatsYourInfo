'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { ArrowLeft, X } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Password reset link sent to ${email}`);
    } catch (err: any) {
      toast.error(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-gray-200 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Reset Password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <Input
              id="reset-email" type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
              className={`text-base p-3 ${error ? 'border-red-500' : ''}`} placeholder="john@example.com" required
            />
            {error && <p className="mt-1 text-sm text-red-600 flex items-center"><X className="h-4 w-4 mr-1" />{error}</p>}
          </div>
          <Button type="submit" className="w-full text-base py-3" disabled={isLoading}>{isLoading ? 'Sending Link...' : 'Send Reset Link'}</Button>
        </form>
        <div className="mt-6 border-t pt-6 text-center">
          <button onClick={onBackToLogin} className="font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </button>
        </div>
      </CardContent>
    </Card>
  );
}