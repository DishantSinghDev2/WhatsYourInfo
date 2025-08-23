'use client';

import { useEffect, useState, FC } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Eye, EyeOff, CheckCircle, XCircle, X, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { isValidEmail, isValidUsername } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Hook & Types ---

// Debounce hook (Unchanged)
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Define a type for the form data for reusability
type FormData = {
    firstName: string; lastName: string; username: string; profileVisibility: 'public' | 'private';
    email: string; password: string; confirmPassword: string;
};

const TOTAL_STEPS = 4;

// --- Main Component ---

export default function NewRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', username: '', profileVisibility: 'public',
    email: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const debouncedUsername = useDebounce(formData.username, 500);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    setCallbackUrl(searchParams.get('callbackUrl'));
  }, [searchParams]);

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
        if (data.suggestions) setUsernameSuggestions(data.suggestions);
        if (errors.username) setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.username;
          return newErrors;
        });
      } catch {
        setUsernameStatus('idle');
      } finally {
        setIsCheckingUsername(false);
      }
    };

    checkUsername();
  }, [debouncedUsername, formData.firstName, formData.lastName, errors.username]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (field === 'username') setUsernameStatus('idle');
  };
  
  const handleNextStep = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) { isValid = false; newErrors.firstName = 'First name is required'; }
        if (!formData.lastName.trim()) { isValid = false; newErrors.lastName = 'Last name is required'; }
        break;
      case 2:
        if (!formData.username.trim()) { isValid = false; newErrors.username = 'Username is required'; }
        else if (usernameStatus === 'taken' || usernameStatus === 'invalid') { isValid = false; newErrors.username = 'Please choose a valid, available username.'; }
        break;
      case 3:
        if (!formData.email.trim()) { isValid = false; newErrors.email = 'Email is required'; }
        else if (!isValidEmail(formData.email)) { isValid = false; newErrors.email = 'Please enter a valid email address'; }
        if (!formData.password) { isValid = false; newErrors.password = 'Password is required'; }
        else if (formData.password.length < 8) { isValid = false; newErrors.password = 'Password must be at least 8 characters'; }
        if (formData.password !== formData.confirmPassword) { isValid = false; newErrors.confirmPassword = 'Passwords do not match'; }
        break;
    }
    
    setErrors(newErrors);

    if (isValid) {
      setDirection(1);
      setStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          profileVisibility: formData.profileVisibility,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created! Please verify your email.');
        const callbackQuery = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : '';
        router.push(`/login/verify-otp?email=${formData.email}${callbackQuery}`);
      } else {
        toast.error(data.error || 'Registration failed');
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
  
  const formVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction * 100 }),
    visible: { opacity: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, x: direction * -100 }),
  };

  // --- START OF FIX ---
  // We remove the `stepComponents` array and will render conditionally below.
  // const stepComponents = [ ... ]; // DELETED

  return (
    <Card className="w-full shadow-xl border-gray-200 overflow-hidden">
        <div className="w-full bg-gray-200 h-1.5">
          <motion.div className="bg-blue-600 h-1.5" animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} transition={{ ease: "easeInOut", duration: 0.5 }} />
        </div>

      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div key={step} custom={direction} variants={formVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
          
          {/* Conditionally render the correct component directly */}
          {step === 1 && <StepOneContent formData={formData} handleInputChange={handleInputChange} errors={errors} handleNextStep={handleNextStep} />}
          {step === 2 && <StepTwoContent formData={formData} handleInputChange={handleInputChange} errors={errors} usernameStatus={usernameStatus} isCheckingUsername={isCheckingUsername} usernameSuggestions={usernameSuggestions} setFormData={setFormData} handleNextStep={handleNextStep} handlePrevStep={handlePrevStep} />}
          {step === 3 && <StepThreeContent formData={formData} handleInputChange={handleInputChange} errors={errors} showPassword={showPassword} setShowPassword={setShowPassword} showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword} handleNextStep={handleNextStep} handlePrevStep={handlePrevStep} />}
          {step === 4 && <StepFourContent formData={formData} handleSubmit={handleSubmit} isLoading={isLoading} handlePrevStep={handlePrevStep} />}

        </motion.div>
      </AnimatePresence>
      {/* --- END OF FIX --- */}
      
      <div className="text-center p-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="font-medium text-blue-600 hover:underline">
              Sign In
            </Link>
        </p>
      </div>
    </Card>
  );
}


// --- Step Component Types & Implementations ---

interface StepOneProps {
    formData: Pick<FormData, 'firstName' | 'lastName'>;
    handleInputChange: (field: keyof FormData, value: string) => void;
    errors: Record<string, string>;
    handleNextStep: () => void;
}

const StepOneContent: FC<StepOneProps> = ({ formData, handleInputChange, errors, handleNextStep }) => (
    <CardContent className="p-8 space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold">Welcome! Let's get started.</h2><p className="text-gray-500">First, tell us your name.</p></div>
        <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label><Input id="firstName" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className={errors.firstName ? 'border-red-500' : ''} placeholder="John" />{errors.firstName && <p className="text-red-600 text-sm mt-1 flex items-center"><X className="h-4 w-4 mr-1"/>{errors.firstName}</p>}</div>
            <div><label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><Input id="lastName" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className={errors.lastName ? 'border-red-500' : ''} placeholder="Doe" />{errors.lastName && <p className="text-red-600 text-sm mt-1 flex items-center"><X className="h-4 w-4 mr-1"/>{errors.lastName}</p>}</div>
        </div>
        <Button onClick={handleNextStep} className="w-full text-base py-3">Next</Button>
    </CardContent>
);

interface StepTwoProps {
    formData: Pick<FormData, 'username' | 'profileVisibility'>;
    handleInputChange: (field: keyof FormData, value: string) => void;
    errors: Record<string, string>;
    usernameStatus: 'idle' | 'available' | 'taken' | 'invalid';
    isCheckingUsername: boolean;
    usernameSuggestions: string[];
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    handleNextStep: () => void;
    handlePrevStep: () => void;
}

const StepTwoContent: FC<StepTwoProps> = ({ formData, handleInputChange, errors, usernameStatus, isCheckingUsername, usernameSuggestions, setFormData, handleNextStep, handlePrevStep }) => (
    <CardContent className="p-8 space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold">Create your public identity</h2><p className="text-gray-500">Choose a username and set your profile's visibility.</p></div>
        <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative"><Input id="username" value={formData.username} onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())} className={`pr-10 ${errors.username || ['taken', 'invalid'].includes(usernameStatus) ? 'border-red-500' : usernameStatus === 'available' ? 'border-green-500' : ''}`} placeholder="johndoe" /><div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">{isCheckingUsername && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}{!isCheckingUsername && usernameStatus === 'available' && <CheckCircle className="h-4 w-4 text-green-500" />}{!isCheckingUsername && (usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle className="h-4 w-4 text-red-500" />}</div></div>
            {errors.username && <p className="text-red-600 text-sm mt-1 flex items-center"><X className="h-4 w-4 mr-1"/>{errors.username}</p>}
            {usernameStatus === 'taken' && usernameSuggestions.length > 0 && <div className="mt-2 text-sm"><span className="text-gray-600">Suggestions:</span><div className="flex flex-wrap gap-2 mt-1">{usernameSuggestions.map(s => (<button type="button" key={s} onClick={() => setFormData(p => ({...p, username: s}))} className="px-2.5 py-1 text-xs bg-gray-100 border rounded-full hover:bg-gray-200">{s}</button>))}</div></div>}
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label><div className="flex w-fit items-center space-x-1 rounded-md bg-gray-100 p-1"><button type="button" onClick={() => setFormData(p=>({...p, profileVisibility: 'public'}))} className={`relative rounded-md px-2 py-1 text-sm font-medium transition-colors ${formData.profileVisibility === 'public' ? 'text-gray-900' : 'text-gray-500'}`}>{formData.profileVisibility === 'public' && <motion.div layoutId="visibility-pill" className="absolute inset-0 z-0 rounded-md bg-white shadow" /> }<span className="relative z-10">Public</span></button><button type="button" onClick={() => setFormData(p=>({...p, profileVisibility: 'private'}))} className={`relative rounded-md px-2 py-1 text-sm font-medium transition-colors ${formData.profileVisibility === 'private' ? 'text-gray-900' : 'text-gray-500'}`}>{formData.profileVisibility === 'private' && <motion.div layoutId="visibility-pill" className="absolute inset-0 z-0 rounded-md bg-white shadow" /> }<span className="relative z-10">Private</span></button></div></div>
        <div className="flex justify-between gap-4 pt-4"><Button variant="outline" onClick={handlePrevStep} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button><Button onClick={handleNextStep} className="w-full">Next</Button></div>
    </CardContent>
);


interface StepThreeProps {
    formData: Pick<FormData, 'email' | 'password' | 'confirmPassword'>;
    handleInputChange: (field: keyof FormData, value: string) => void;
    errors: Record<string, string>;
    showPassword: boolean; setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    showConfirmPassword: boolean; setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
    handleNextStep: () => void; handlePrevStep: () => void;
}

const StepThreeContent: FC<StepThreeProps> = ({ formData, handleInputChange, errors, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, handleNextStep, handlePrevStep }) => (
    <CardContent className="p-8 space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold">Secure your account</h2><p className="text-gray-500">Enter your email and a strong password.</p></div>
        <div className="space-y-4">
            <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label><Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={errors.email ? 'border-red-500' : ''} placeholder="you@example.com" />{errors.email && <p className="text-red-600 text-sm mt-1 flex items-center"><X className="h-4 w-4 mr-1"/>{errors.email}</p>}</div>
            <div><label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label><div className="relative"><Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className={`pr-10 ${errors.password ? 'border-red-500' : ''}`} placeholder="8+ characters" /><button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={() => setShowPassword(p => !p)}>{showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}</button></div>{errors.password && <p className="text-red-600 text-sm mt-1 flex items-center"><X className="h-4 w-4 mr-1"/>{errors.password}</p>}</div>
            <div><label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><div className="relative"><Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`} placeholder="••••••••" /><button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={() => setShowConfirmPassword(p => !p)}>{showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}</button></div>{errors.confirmPassword && <p className="text-red-600 text-sm mt-1 flex items-center"><X className="h-4 w-4 mr-1"/>{errors.confirmPassword}</p>}</div>
        </div>
        <div className="flex justify-between gap-4 pt-4"><Button variant="outline" onClick={handlePrevStep} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button><Button onClick={handleNextStep} className="w-full">Next</Button></div>
    </CardContent>
);

interface StepFourProps {
    formData: Pick<FormData, 'firstName' | 'lastName' | 'username' | 'email' | 'profileVisibility'>;
    handleSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    handlePrevStep: () => void;
}

const StepFourContent: FC<StepFourProps> = ({ formData, handleSubmit, isLoading, handlePrevStep }) => (
    <CardContent className="p-8 space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold">One last check</h2><p className="text-gray-500">Does everything look correct?</p></div>
        <div className="space-y-3 rounded-md border p-4 text-sm bg-gray-50">
            <div className="flex justify-between"><span>Name:</span><span className="font-medium text-gray-800">{formData.firstName} {formData.lastName}</span></div>
            <div className="flex justify-between"><span>Username:</span><span className="font-medium text-gray-800">{formData.username}</span></div>
            <div className="flex justify-between"><span>Email:</span><span className="font-medium text-gray-800">{formData.email}</span></div>
            <div className="flex justify-between"><span>Visibility:</span><span className="font-medium text-gray-800 capitalize">{formData.profileVisibility}</span></div>
        </div>
        <div className="flex justify-between gap-4"><Button variant="outline" onClick={handlePrevStep} className="w-full" disabled={isLoading}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button><Button onClick={handleSubmit} className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Account</Button></div>
        <p className="text-center text-xs text-gray-500 pt-2">By creating an account, you agree to our <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.</p>
    </CardContent>
);