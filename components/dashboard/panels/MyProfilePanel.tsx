'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface MyProfilePanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
  changesSaved: (a: boolean) => void
}

export default function MyProfilePanel({ user, onUpdate, changesSaved }: MyProfilePanelProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    bio: user.bio || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    if (keys.length > 1) {
      setFormData((prev) => {
        const updated = { ...prev };
        let current: any = updated;
        for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
        current[keys[keys.length - 1]] = value;
        return updated;
      });
      onUpdate(formData)
      changesSaved(false)
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving profile...');
    try {
      const res = await fetch('/api/profile/details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save profile');
      toast.success('Profile updated!', { id: toastId });
      changesSaved(true)
    } catch (err) {
      toast.error('Could not save profile.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="space-y-10 text-sm">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h1 className="text-xl font-semibold mb-1">My Profile</h1>
        <p className="text-gray-500">Public details that appear on your profile page.</p>
      </motion.div>

      {/* Name Section */}
      <motion.div
        className="space-y-3 border p-4 rounded-md bg-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <label className="font-medium text-gray-700">Name</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" />
          <Input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
        </div>
      </motion.div>

      {/* Bio Section */}
      <motion.div
        className="space-y-3 border p-4 rounded-md bg-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700">Bio</label>
        </div>
        <Textarea
          name="bio"
          rows={5}
          placeholder="e.g. Frontend dev, gamer, curious about AI..."
          value={formData.bio}
          onChange={handleChange}
        />
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
