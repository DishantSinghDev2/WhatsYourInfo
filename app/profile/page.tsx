'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import Header from '@/components/Header';
import ProfilePreview from '@/components/dashboard/ProfilePreview';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { UserProfile } from '@/types';

// Panels
import MyProfilePanel, { MyProfilePanelProps } from '@/components/dashboard/panels/MyProfilePanel';
import DesignPanel, { DesignPanelProps } from '@/components/dashboard/panels/DesignPanel';
import AvatarsPanel, { AvatarsPanelProps } from '@/components/dashboard/panels/AvatarsPanel';
import LinksPanel, { LinksPanelProps } from '@/components/dashboard/panels/LinksPanel';
import VerifiedAccountsPanel, { VerifiedAccountsPanelProps } from '@/components/dashboard/panels/VerifiedAccountsPanel';
import WalletPanel, { WalletPanelProps } from '@/components/dashboard/panels/WalletPanel';
import PhotosPanel, { PhotosPanelProps } from '@/components/dashboard/panels/PhotosPanel';
import ToolsPanel, { ToolsPanelProps } from '@/components/dashboard/panels/ToolsPanel';
import AccountSettingsPanel, { AccountSettingsPanelProps } from '@/components/dashboard/panels/AccountSettingsPanel';
import { ChevronLeft } from 'lucide-react';


interface PanelRegistry {
  profile: React.ComponentType<MyProfilePanelProps>;
  design: React.ComponentType<DesignPanelProps>;
  avatars: React.ComponentType<AvatarsPanelProps>;
  links: React.ComponentType<LinksPanelProps>;
  verified: React.ComponentType<VerifiedAccountsPanelProps>;
  wallet: React.ComponentType<WalletPanelProps>;
  photos: React.ComponentType<PhotosPanelProps>;
  tools: React.ComponentType<ToolsPanelProps>;
  settings: React.ComponentType<AccountSettingsPanelProps>;
}

const panelComponents: PanelRegistry = {
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
  const [backToTool, setBackToTool] = useState<string | null>("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // --- NEW STATE for mobile preview visibility ---
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

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
      return updated;
    });
  };

  const handleChangesSaved = (a: boolean) => {
    setHasUnsavedChanges(!a)
  }


  const ActivePanelComponent = activePanel ? panelComponents[activePanel] : null;
  
  if (isLoading || !draftUser) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="sr-only">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-sm">
      <Header />
      <div className='flex flex-row overflow-hidden h-full'>

        {/* --- Sidebar / Left Panel (Now full-width on mobile) --- */}
        <div className="flex-grow w-full md:w-auto md:max-w-xl px-4 py-6 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {ActivePanelComponent ? (
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={handleBackToNav}
                  className="mb-4 text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  <ChevronLeft className='bg-gray-200 rounded-full p-2 w-8 h-8 hover:bg-gray-100 transition duration-100' />
                </button>
                <ActivePanelComponent user={draftUser} onUpdate={handleUpdate} changesSaved={handleChangesSaved} />
              </motion.div>
            ) : (
              <motion.div key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Pass the function to open the mobile preview */}
                <DashboardNav 
                  setActivePanel={setActivePanel} 
                  user={draftUser} 
                  onShowPreview={() => setIsMobilePreviewOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- Desktop Preview Panel (Hidden on mobile) --- */}
        <div className="h-full w-full overflow-y-auto custom-scrollbar-preview bg-gray-800 hidden md:block">
          <ProfilePreview user={draftUser} />
        </div>
        
        {/* --- Mobile Preview Panel (Animated Overlay) --- */}
        <AnimatePresence>
          {isMobilePreviewOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed  z-50 h-full w-full bg-gray-800 md:hidden"
            >
              <ProfilePreview 
                user={draftUser}
                isMobileView={true}
                onClose={() => setIsMobilePreviewOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
