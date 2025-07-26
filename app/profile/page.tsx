'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Header from '@/components/Header';
import ProfilePreview from '@/components/dashboard/ProfilePreview';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { UserProfile } from '@/types';

// Panels
import MyProfilePanel from '@/components/dashboard/panels/MyProfilePanel';
import DesignPanel from '@/components/dashboard/panels/DesignPanel';
import AvatarsPanel from '@/components/dashboard/panels/AvatarsPanel';
import LinksPanel from '@/components/dashboard/panels/LinksPanel';
import VerifiedAccountsPanel from '@/components/dashboard/panels/VerifiedAccountsPanel';
import WalletPanel from '@/components/dashboard/panels/WalletPanel';
import PhotosPanel from '@/components/dashboard/panels/PhotosPanel';
import ToolsPanel from '@/components/dashboard/panels/ToolsPanel';
import AccountSettingsPanel from '@/components/dashboard/panels/AccountSettingsPanel';

const panelComponents: Record<string, React.ComponentType<any>> = {
  profile: MyProfilePanel,
  design: DesignPanel,
  avatars: AvatarsPanel,
  links: LinksPanel,
  verified: VerifiedAccountsPanel,
  wallet: WalletPanel,
  photos: PhotosPanel,
  tools: ToolsPanel,
  settings: AccountSettingsPanel,
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [draftUser, setDraftUser] = useState<UserProfile | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUser(data);
        setDraftUser(data);
      } catch {
        toast.error('Session expired. Please log in.');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [router]);

  const handleBackToNav = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('Discard unsaved changes?')) return;
      setHasUnsavedChanges(false);
      setDraftUser(user); // Revert changes
    }
    setActivePanel(null);
  };

  const handleUpdate = (updatedData: Partial<UserProfile>) => {
    setDraftUser(prev => {
      const updated = prev ? { ...prev, ...updatedData } : null;
      if (JSON.stringify(updated) !== JSON.stringify(user)) {
        setHasUnsavedChanges(true);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!draftUser) return;
    try {
      const res = await fetch('/api/profile/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftUser),
      });
      if (!res.ok) throw new Error();
      setUser(draftUser);
      setHasUnsavedChanges(false);
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save changes.');
    }
  };

  const ActivePanelComponent = activePanel ? panelComponents[activePanel] : null;

  if (isLoading || !draftUser) return <div className="p-8 text-center text-sm text-gray-500">Loading profile...</div>;

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-sm">
      <Header />
      <div className='flex flex-row overflow-hidden'>

        {/* Sidebar / Left Panel */}
          <div className="flex-grow px-4 py-6 overflow-y-auto custom-scrollbar w-[559px]">
            <AnimatePresence mode="wait">
              {ActivePanelComponent ? (
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={handleBackToNav}
                    className="mb-4 text-blue-600 hover:underline text-sm flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <ActivePanelComponent user={draftUser} onUpdate={handleUpdate} />
                  {hasUnsavedChanges && (
                    <div className="flex justify-end pt-6">
                      <button
                        onClick={handleSave}
                        className="bg-black text-white px-4 py-2 rounded text-xs font-medium hover:bg-gray-900 transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <DashboardNav setActivePanel={setActivePanel} user={draftUser} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        {/* Preview Panel */}
          <div className="h-full w-full overflow-y-auto custom-scrollbar-preview p-4 bg-gray-800">
            <ProfilePreview user={draftUser} />
          </div>
      </div>
    </div>
  );
}
