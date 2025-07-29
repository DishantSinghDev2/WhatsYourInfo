// components/settings/EmailSettingsPanel.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User as AuthUser } from '@/lib/auth';
import toast from 'react-hot-toast';

export function EmailSettingsPanel({ user }: { user: AuthUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(user.email);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setIsEditing(false);
      // You would typically force a re-login or session refresh here
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update email.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Address</CardTitle>
        <CardDescription>This is the email address associated with your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-gray-800">{isEditing ? 'Enter new email:' : user.email}</p>
            {!isEditing && user.emailVerified && <span className="text-xs text-green-600 font-medium">Verified</span>}
            {!isEditing && !user.emailVerified && <span className="text-xs text-yellow-600 font-medium">Verification Pending</span>}
          </div>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="mt-3 sm:mt-0">Change</Button>
          ) : (
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
               <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" />
               <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
               <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}