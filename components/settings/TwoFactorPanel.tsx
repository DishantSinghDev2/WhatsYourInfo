// components/settings/TwoFactorPanel.tsx

'use client';
import { useState } from 'react';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Copy, CheckCircle, ShieldCheck, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// Define the component's props to include the user object
export function TwoFactorPanel({ user }: { user: UserProfile }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled || false);

  // State for the setup flow
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [setupStep, setSetupStep] = useState(1); // 1: Initial, 2: Scan QR, 3: Save Codes

  // State for managing an already-enabled setup
  const [isManaging, setIsManaging] = useState<'viewing_codes' | 'disabling' | null>(null);
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleEnable = async () => {
    setIsLoading(true);
    const res = await fetch('/api/settings/2fa', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setSetupData(data);
      setSetupStep(2);
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
      setSetupStep(3);
      setIs2FAEnabled(true);
      toast.success("2FA enabled successfully!");
    } else {
      toast.error(data.error || "Verification failed.");
    }
    setIsLoading(false);
  };

  const handleViewCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/2fa-recovery-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecoveryCodes(data.recoveryCodes);
      setSetupStep(3); // Go to the recovery codes display step
      setIsManaging(null); // Close the manage modal
      setPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not retrieve codes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/2fa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("2FA has been disabled.");
      setIs2FAEnabled(false);
      setIsManaging(null);
      setPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disable 2FA.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success("Recovery codes copied!");
  };

  const downloadCodes = () => {
    const blob = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsyourinfo-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Main Render Logic ---

  // STEP 3: Display Recovery Codes (used by both setup and view flows)
  if (setupStep === 3) {
    return (
      <div>
        <h3 className="text-lg font-bold text-green-600 flex items-center"><CheckCircle className="mr-2" />Action Complete</h3>
        <p className="mt-2 text-gray-600">Please save these new recovery codes in a secure place, like a password manager. They replace any previous codes.</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 my-4 p-4 bg-gray-100 rounded-md font-mono text-gray-700">
          {recoveryCodes.map(code => <span key={code}>{code}</span>)}
        </div>
        <div className="flex gap-2">
          <Button onClick={copyCodes}><Copy className="mr-2 h-4 w-4" />Copy Codes</Button>
          <Button onClick={downloadCodes} variant="outline"><Download className="mr-2 h-4 w-4" />Download</Button>
          <Button onClick={() => setSetupStep(1)}>Done</Button>
        </div>
      </div>
    );
  }


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // STEP 2: Scan QR Code (Setup flow only)
  if (setupStep === 2 && setupData) {
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
              <Button size="icon" variant="ghost" onClick={() => copyToClipboard(setupData.secret)}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        <form onSubmit={handleVerify} className="mt-4 flex items-center gap-2">
          <Input value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="6-digit code" maxLength={6} required />
          <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "Verify & Activate"}</Button>
        </form>
      </div>
    );
  }

  // STEP 1: Main View (Handles enabled, disabled, and managing states)
  return (
    <div>
      {is2FAEnabled ? (
        // --- 2FA IS ENABLED ---
        <div>
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <ShieldCheck className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Two-Factor Authentication is Active</h3>
              <p className="text-sm text-green-700">Your account is protected with an additional layer of security.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setIsManaging('viewing_codes')}>View Recovery Codes</Button>
            <Button variant="destructive" onClick={() => setIsManaging('disabling')}>Disable 2FA</Button>
          </div>

          {/* Modal-like form for secure actions */}
          {isManaging && (
            <div className="mt-6 border-t pt-6">
              <form onSubmit={isManaging === 'viewing_codes' ? handleViewCodes : handleDisable}>
                <h4 className="font-semibold">{isManaging === 'disabling' ? 'Confirm Disabling 2FA' : 'View Your Recovery Codes'}</h4>
                <p className="text-sm text-gray-500 mb-2">For your security, please enter your current password to continue.</p>
                <div className="flex items-center gap-2">
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your current password" required />
                  <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : 'Confirm'}</Button>
                  <Button variant="ghost" onClick={() => setIsManaging(null)}>Cancel</Button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        // --- 2FA IS DISABLED ---
        <div>
          <p className="text-sm text-gray-600">Add an extra layer of security to your account with a time-based one-time password (TOTP).</p>
          <Button onClick={handleEnable} disabled={isLoading} className="mt-4">
            {isLoading ? <Loader2 className="animate-spin" /> : "Enable Authenticator App"}
          </Button>
        </div>
      )}
    </div>
  );
}