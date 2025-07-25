'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // If using App Router, use 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Header from '@/components/Header';
import ProfilePreview from '@/components/dashboard/ProfilePreview';
import DashboardNav from '@/components/dashboard/DashboardNav'; // New component
import { UserProfile } from '@/types';

// Import all management panels
import MyProfilePanel from '@/components/dashboard/panels/MyProfilePanel';
import DesignPanel from '@/components/dashboard/panels/DesignPanel';
import AvatarsPanel from '@/components/dashboard/panels/AvatarsPanel';
import LinksPanel from '@/components/dashboard/panels/LinksPanel';
import VerifiedAccountsPanel from '@/components/dashboard/panels/VerifiedAccountsPanel';
import WalletPanel from '@/components/dashboard/panels/WalletPanel';
import PhotosPanel from '@/components/dashboard/panels/PhotosPanel';
import ToolsPanel from '@/components/dashboard/panels/ToolsPanel';
import AccountSettingsPanel from '@/components/dashboard/panels/AccountSettingsPanel';

const panelComponents: { [key: string]: React.ComponentType<any> } = {
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
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<string | null>(null); // 'profile', 'design', or null for main nav

  // This function will be passed to child components to update the user state
  const handleUpdateUser = (updatedData: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (!response.ok) throw new Error('Auth failed');
        const data = await response.json();
        setUser(data.user);
      } catch {
        toast.error('Session expired. Please log in.');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [router]);

  // The LIVE UPDATE function. Passed to all panels.
  const handleUpdate = (updatedData: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
  };

  const ActivePanelComponent = activePanel ? panelComponents[activePanel] : null;

  if (isLoading || !user) {
    return <div>Loading...</div>; // Add a proper loader
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <Header />
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        
        {/* Left Control Panel */}
        <ResizablePanel defaultSize={35} minSize={25} className="bg-white flex flex-col">
          <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {ActivePanelComponent ? (
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <button onClick={() => setActivePanel(null)} className="mb-6 text-sm font-semibold text-blue-600 hover:underline flex items-center gap-2">
                    ← Back to Navigation
                  </button>
                  <ActivePanelComponent user={user} onUpdate={handleUpdate} />
                </motion.div>
              ) : (
                <motion.div key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <DashboardNav setActivePanel={setActivePanel} user={user} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />

        {/* Right Preview Panel */}
        <ResizablePanel defaultSize={65} minSize={30}>
          <div className="h-full w-full overflow-y-auto custom-scrollbar-preview p-4 bg-gray-800">
            <ProfilePreview user={user} />
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}