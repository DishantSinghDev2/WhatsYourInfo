'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false); // State to show success message

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }
      
      // On success, switch to the confirmation view
      setIsSubmitted(true);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // View to show after successful submission
  if (isSubmitted) {
      return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-gray-200 shadow-xl">
                <CardHeader className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <CardTitle className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Check your inbox</CardTitle>
                    <CardDescription>
                        A password reset link has been sent to <span className="font-medium text-gray-800">{email}</span> if an account exists with that address.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <button onClick={onBackToLogin} className="font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center w-full">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Sign In
                    </button>
                </CardContent>
            </Card>
          </motion.div>
      )
  }

  // Default form view
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