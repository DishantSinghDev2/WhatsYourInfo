// components/settings/RecoveryEmailPanel.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserProfile } from '@/types'; // Assuming UserProfile is available
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export function RecoveryEmailPanel({ user }: { user: UserProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(user.recoveryEmail || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/recovery-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message);
      setIsEditing(false);
      setCurrentPassword(''); // Clear password field
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update recovery email.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Email</CardTitle>
        <CardDescription>
          Add a secure recovery email to help you get back into your account if you're ever locked out.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="flex items-center justify-between">
            {user.recoveryEmail ? (
              <div>
                <p className="font-medium text-gray-800">{user.recoveryEmail}</p>
                <span className="text-xs text-green-600 font-medium">Verified</span>
              </div>
            ) : (
              <p className="text-gray-500">No recovery email has been set.</p>
            )}
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              {user.recoveryEmail ? 'Change' : 'Add Recovery Email'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Recovery Email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm with Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Sending...' : 'Save and Verify'}
              </Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}