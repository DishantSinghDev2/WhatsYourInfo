'use client';

import { useState } from 'react';
import Switch from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserProfile } from '@/types';

export default function PrivateMessages({
  user,
  onUpdate,
}: {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void
}) {
  const [isEnabled, setIsEnabled] = useState(user.settings?.privateMessagesEnabled || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsEnabled(checked);
    setIsSaving(true);

    try {
      const res = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...user.settings,
            privateMessagesEnabled: checked,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      onUpdate({ settings: { ...user.settings, privateMessagesEnabled: checked } });

      toast.success(`Private messages ${checked ? 'enabled' : 'disabled'}.`);
    } catch {
      toast.error('Could not update your settings.');
      setIsEnabled(!checked); // Revert toggle
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <MailCheck className="w-6 h-6 text-green-600" />
        <h2 className="text-lg font-semibold">Private Email</h2>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">
        When enabled, a <strong>Mail Icon</strong> button will appear on your profile. Which will show users, your registered email: <code>{user.email}</code>
      </p>

      <div className="flex items-center justify-between px-4 py-3 border rounded-md bg-muted">
        <div className="flex items-center gap-3">
          <Switch
            id="private-messages"
            checked={isEnabled}
            onChange={handleToggle}
          />
          <Label htmlFor="private-messages" className="text-sm">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
        <span className="text-xs text-gray-500">
          {isSaving ? 'Saving...' : isEnabled ? 'Visitors can contact you' : 'Hidden from public'}
        </span>
      </div>
    </div>
  );
}
