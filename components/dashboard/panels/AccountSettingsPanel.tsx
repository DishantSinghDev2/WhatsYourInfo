// components/AccountSettingsPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// A lightweight, custom confirmation dialog component
function CustomConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isActionInProgress,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isActionInProgress: boolean;
}) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900">Are you absolutely sure?</h2>
        <p className="mt-2 text-sm text-gray-600">
          This action can be undone by logging again. This will permanently delete your account and all of your data from our servers after the grace period of 30 days. If you want immediate deletion, please contact us at <a href='mailto:data@whatsyour.info' className='text-blue-600 hover:underline'>data@whatsyour.info</a>
        </p>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isActionInProgress}
            className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isActionInProgress}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400"
          >
            {isActionInProgress ? 'Deleting...' : 'Yes, delete my account'}
          </button>
        </div>
      </div>
    </div>
  );
}
export interface AccountSettingsPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export default function AccountSettingsPanel({ user, onUpdate }: AccountSettingsPanelProps) {
  const [username, setUsername] = useState(user.username);
  // NEW: State for profile visibility
  const [visibility, setVisibility] = useState<UserProfile['profileVisibility']>(user.profileVisibility || 'public');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  // When user prop changes, sync the local state
  useEffect(() => {
    setUsername(user.username);
    setVisibility(user.profileVisibility || 'public');
  }, [user]);

  const handleUsernameChange = async () => {
    if (username.trim() === user.username) return;
    setIsSavingUsername(true);
    const toastId = toast.loading('Saving username...');
    try {
      const response = await fetch('/api/profile/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success('Username updated successfully!', { id: toastId });
      onUpdate({ username: username.trim() });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save username.', { id: toastId });
      setUsername(user.username); // Revert on error
    } finally {
      setIsSavingUsername(false);
    }
  };

  // NEW: Handler for visibility change
  const handleVisibilityChange = async (newVisibility: UserProfile['profileVisibility']) => {
    if (newVisibility === visibility) return;

    setVisibility(newVisibility); // Optimistic UI update
    setIsSavingVisibility(true);
    const toastId = toast.loading('Updating visibility...');

    try {
      const response = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileVisibility: newVisibility }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update visibility');
      }

      toast.success('Profile visibility updated!', { id: toastId });
      onUpdate({ profileVisibility: newVisibility }); // Notify parent of success
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update visibility.', { id: toastId });
      setVisibility(user.profileVisibility || 'public'); // Revert on error
    } finally {
      setIsSavingVisibility(false);
    }
  };


  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/profile', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete account.');

      toast.success('Account deleted. Redirecting...');
      // Redirect to the home page after a short delay
      setTimeout(() => router.push('/deleted'), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred.');
      setIsDeleting(false); // Only reset if deletion fails
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">Account Settings</h2>
        <p className="text-gray-500 mt-1">Manage your account-wide settings and data.</p>
      </div>

      {/* Custom Username Section */}
      <div className="border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-800">Your Profile URL</h3>
        <p className="text-sm text-gray-500 mt-1">Changing your username will change your profile URL, which can break existing links.</p>
        <div className="mt-4 flex items-stretch sm:items-center flex-col sm:flex-row gap-2">
          <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 py-2 text-gray-600 shrink-0">whatsyour.info/</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleUsernameChange}
            disabled={isSavingUsername || username.trim() === user.username}
            className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSavingUsername ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>


      {/* --- NEW: Profile Visibility Section --- */}
      <div className="border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-800">Profile Visibility</h3>
        <p className="text-sm text-gray-500 mt-1">Control who can see your profile page on the web.</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <label className={`flex items-center p-3 border rounded-md cursor-pointer w-full transition-all ${visibility === 'public' ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'}`}>
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === 'public'}
              onChange={() => handleVisibilityChange('public')}
              disabled={isSavingVisibility}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-900">
              Public
              <p className="text-xs font-normal text-gray-500">Visible to everyone, including search engines(PRO).</p>
            </span>
          </label>
          <label className={`flex items-center p-3 border rounded-md cursor-pointer w-full transition-all ${visibility === 'private' ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'}`}>
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === 'private'}
              onChange={() => handleVisibilityChange('private')}
              disabled={isSavingVisibility}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3 text-sm font-medium text-gray-900">
              <p>Private</p>
              <p className="text-xs font-normal text-gray-500">
                Visible to only you.
              </p>
            </div>
          </label>
        </div>
      </div>


      {/* Custom Danger Zone Section */}
      <div className="border border-red-500/50 rounded-lg p-5">
        <h3 className="font-semibold text-red-600">Danger Zone</h3>
        <div className="mt-4 md:flex md:items-center md:justify-between">
          <p className="text-sm text-gray-600">Permanently delete your entire account.<br />This action is not final and can be undone within 30 days.</p>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="mt-3 md:mt-0 w-full md:w-auto px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete My Account
          </button>
        </div>
      </div>

      <CustomConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        isActionInProgress={isDeleting}
      />
    </div>
  );
}