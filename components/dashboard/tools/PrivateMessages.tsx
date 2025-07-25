'use client';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/types';
import toast from 'react-hot-toast';

export default function PrivateMessages({ user, onUpdate }: { user: UserProfile, onUpdate: (d: any) => void}) {
    // Assuming a setting like `user.settings.privateMessagesEnabled`
    const [isEnabled, setIsEnabled] = useState(user.settings?.privateMessagesEnabled || false);

    const handleToggle = async (checked: boolean) => {
        setIsEnabled(checked);
        onUpdate({ settings: { ...user.settings, privateMessagesEnabled: checked }});
        // Here you would make an API call to save this setting
        // await fetch('/api/profile/settings', { method: 'PUT', body: JSON.stringify({ privateMessagesEnabled: checked }) });
        toast.success(`Private messages ${checked ? 'enabled' : 'disabled'}.`);
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Private Messages</h2>
            <p className="text-sm text-gray-500">When enabled, a "Contact" button will appear on your profile. Messages will be securely forwarded to your registered email address.</p>
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <Switch id="private-messages" checked={isEnabled} onCheckedChange={handleToggle} />
                <Label htmlFor="private-messages">Enable Private Messages</Label>
            </div>
        </div>
    );
}