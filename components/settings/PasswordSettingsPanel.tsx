// components/settings/PasswordSettingsPanel.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export function PasswordSettingsPanel() {
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
        toast.error("New passwords do not match.");
        return;
    }
    setIsSaving(true);
    try {
        const res = await fetch('/api/settings/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error);
        toast.success('Password changed successfully.');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>For your security, we recommend choosing a strong password that you don't use elsewhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
          <div>
            <label className="text-sm font-medium">Current Password</label>
            <Input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} required />
          </div>
          <div>
            <label className="text-sm font-medium">New Password</label>
            <Input type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} required />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm New Password</label>
            <Input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} required />
          </div>
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Password'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}