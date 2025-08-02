'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import { Eye, EyeOff, CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { isValidEmail, isValidUsername } from '@/lib/utils';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Debounce hook to prevent API calls on every keystroke
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    profileVisibility: 'public',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Start of new feature state ---
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const debouncedUsername = useDebounce(formData.username, 500); // 500ms delay
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    const callback = searchParams.get('callbackUrl');
    if (callback) setCallbackUrl(callback);
  }, [searchParams]);
  // --- End of new feature state ---

  // --- Effect to check username when user stops typing ---
  useEffect(() => {
    if (!debouncedUsername) {
      setUsernameStatus('idle');
      return;
    }
    if (!isValidUsername(debouncedUsername)) {
      setUsernameStatus('invalid');
      setErrors(prev => ({ ...prev, username: 'Invalid characters in username.' }));
      return;
    }

    const checkUsername = async () => {
      setIsCheckingUsername(true);
      setUsernameSuggestions([]);
      try {
        const response = await fetch('/api/username/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: debouncedUsername,
            firstName: formData.firstName,
            lastName: formData.lastName,
          }),
        });
        const data = await response.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
        if (data.suggestions) {
          setUsernameSuggestions(data.suggestions);
        }
        // Clear manual validation error if API check is successful
        if (errors.username) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.username;
            return newErrors;
          });
        }
      } catch {
        setUsernameStatus('idle'); // Reset on API error
      } finally {
        setIsCheckingUsername(false);
      }
    };

    checkUsername();
  }, [debouncedUsername, formData.firstName, formData.lastName]);


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (!isValidUsername(formData.username)) newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';

    // Add check for the live username status
    if (usernameStatus === 'taken') newErrors.username = 'This username is already taken.';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a valid email address';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created! Please check your email to verify your account.');
        router.push(`/verify-otp${(callbackUrl !== null) ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`);
      } else {
        toast.error(data.error || 'Registration failed');
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((detail: {
            path: string[];
            message: string;
          }) => {
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

  const handleVisibilityChange = (visibility: 'public' | 'private') => {
         setFormData(prev => ({ ...prev, profileVisibility: visibility }));
       };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Reset username status on manual change
    if (field === 'username') setUsernameStatus('idle');
  };

  // Function to handle clicking a username suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, username: suggestion }));
    setUsernameSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Image src="/logo.svg" alt="WhatsYour.Info" width={42} height={42} className='mx-auto' />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Create your account</h2>
            <p className="mt-2 text-sm text-gray-600">Join thousands of professionals on What'sYour.Info</p>
          </div>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle>Get started for free</CardTitle>
              <CardDescription>Create your professional profile in minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name & Last Name (Unchanged) */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <Input id="firstName" type="text" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className={errors.firstName ? 'border-red-500' : ''} placeholder="John" />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600 flex items-center"><X className="h-4 w-4 mr-1" />{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <Input id="lastName" type="text" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className={errors.lastName ? 'border-red-500' : ''} placeholder="Doe" />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600 flex items-center"><X className="h-4 w-4 mr-1" />{errors.lastName}</p>}
                  </div>
                </div>

                {/* --- USERNAME INPUT with Live Validation --- */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                      className={errors.username || usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500' : (usernameStatus === 'available' ? 'border-green-500' : '')}
                      placeholder="johndoe"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      {isCheckingUsername && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                      {!isCheckingUsername && usernameStatus === 'available' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {!isCheckingUsername && (usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600 flex items-center"><X className="h-4 w-4 mr-1" />{errors.username}</p>
                  )}
                  {/* Suggestions Box */}
                  {usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Maybe try one of these:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {usernameSuggestions.map(s => (
                          <button type="button" key={s} onClick={() => handleSuggestionClick(s)} className="px-2.5 py-1 text-xs bg-gray-100 border border-gray-300 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* --- START: Profile Visibility Section --- */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Visibility
                  </label>

                  <div className="flex w-fit items-center space-x-1 rounded-full bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => handleVisibilityChange('public')}
                      className={`relative rounded-full px-5 py-1.5 text-sm font-medium transition-colors
        ${formData.profileVisibility === 'public' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {formData.profileVisibility === 'public' && (
                        <motion.div
                          layoutId="visibility-pill"
                          className="absolute inset-0 z-0 rounded-full bg-white shadow"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVisibilityChange('private')}
                      className={`relative rounded-full px-5 py-1.5 text-sm font-medium transition-colors
        ${formData.profileVisibility === 'private' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {formData.profileVisibility === 'private' && (
                        <motion.div
                          layoutId="visibility-pill"
                          className="absolute inset-0 z-0 rounded-full bg-white shadow"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">Private</span>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {formData.profileVisibility === 'public'
                      ? 'Your profile will be visible to everyone.'
                      : 'Your profile will only be visible to you.'}
                  </p>
                </div>
                {/* --- END: Profile Visibility Section --- */}

                {/* Email (Unchanged) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={errors.email ? 'border-red-500' : ''} placeholder="john@example.com" />
                  {errors.email && <p className="mt-1 text-sm text-red-600 flex items-center"><X className="h-4 w-4 mr-1" />{errors.email}</p>}
                </div>

                {/* Password & Confirm Password (Unchanged) */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className={errors.password ? 'border-red-500' : ''} placeholder="••••••••" />
                    <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}</button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600 flex items-center"><X className="h-4 w-4 mr-1" />{errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} className={errors.confirmPassword ? 'border-red-500' : ''} placeholder="••••••••" />
                    <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}</button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 flex items-center"><X className="h-4 w-4 mr-1" />{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Creating Account...' : 'Create Account'}</Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                  <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">Already have an account?</span></div>
                </div>
                <div className="mt-6 text-center">
                  <Link href={`/login${callbackUrl && `?callbackUrl=${callbackUrl}`}`}><Button variant="outline" className="w-full">Sign In Instead</Button></Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}