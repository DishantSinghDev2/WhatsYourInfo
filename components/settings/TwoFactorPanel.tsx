// components/settings/TwoFactorPanel.tsx

'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function TwoFactorPanel() {
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Initial, 2: Scan QR, 3: Save Recovery Codes

  const handleEnable = async () => {
    setIsLoading(true);
    const res = await fetch('/api/settings/2fa', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setSetupData(data);
      setStep(2);
    } else {
      toast.error('Could not start 2FA setup.');
    }
    setIsLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch('/api/settings/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode })
    });
    const data = await res.json();
    if (res.ok) {
        setRecoveryCodes(data.recoveryCodes);
        setStep(3);
        toast.success("2FA enabled successfully!");
    } else {
        toast.error(data.error || "Verification failed.");
    }
    setIsLoading(false);
  };
  
  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
  };

  if (step === 3) {
    return (
      <div>
        <h3 className="text-lg font-bold text-green-600 flex items-center"><CheckCircle className="mr-2"/>2FA Is Now Active</h3>
        <p className="mt-2 text-gray-600">Please save these recovery codes in a secure place. They can be used to access your account if you lose your device.</p>
        <div className="grid grid-cols-2 gap-3 my-4 p-4 bg-gray-100 rounded-md font-mono text-gray-700">
          {recoveryCodes.map(code => <span key={code}>{code}</span>)}
        </div>
        <Button onClick={() => setStep(1) /* or close modal */}>Done</Button>
      </div>
    );
  }

  if (step === 2 && setupData) {
    return (
      <div>
        <h3 className="font-semibold">Step 2: Scan & Verify</h3>
        <p className="text-sm text-gray-500 mb-4">Scan the QR code with your authenticator app (like Google Authenticator or Authy), then enter the 6-digit code below.</p>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <img src={setupData.qrCodeDataUrl} alt="2FA QR Code" className="border rounded-lg p-2 bg-white" />
          <div>
            <p className="text-sm font-medium">Or enter this key manually:</p>
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
              <code className="font-mono text-gray-700">{setupData.secret}</code>
              <Button size="icon" variant="ghost" onClick={() => copyToClipboard(setupData.secret)}><Copy className="h-4 w-4"/></Button>
            </div>
          </div>
        </div>
        <form onSubmit={handleVerify} className="mt-4 flex items-center gap-2">
          <Input value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="6-digit code" maxLength={6} required />
          <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin"/> : "Verify & Activate"}</Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-600">Add an extra layer of security to your account.</p>
      <Button onClick={handleEnable} disabled={isLoading} className="mt-4">
        {isLoading ? <Loader2 className="animate-spin" /> : "Enable Authenticator App"}
      </Button>
    </div>
  );
}