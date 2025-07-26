'use client';

import { useState } from 'react';
import { SiX, SiGithub, SiLinkedin } from 'react-icons/si';
import { Button } from '@/components/ui/Button';
import { UserProfile } from '@/types';
import VerifiedTick from '@/components/profile/VerifiedTick';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const services = [
  { id: 'twitter', name: 'X', icon: SiX },
  { id: 'github', name: 'GitHub', icon: SiGithub },
  { id: 'linkedin', name: 'LinkedIn', icon: SiLinkedin },
];

export default function VerifiedAccountsPanel({
  user,
  onUpdate,
}: {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}) {
  const router = useRouter();
  const [verifying, setVerifying] = useState<string | null>(null);

  const connectedAccounts = user.verifiedAccounts || [];

  const handleConnect = async (providerId: string) => {
    toast('Redirecting to connect...', { icon: '🔐' });
    signIn(providerId, { callbackUrl: '/profile' });
  };

  const handleDisconnect = async (providerId: string) => {
    const toastId = toast.loading(`Disconnecting ${providerId}...`);
    try {
      const response = await fetch('/api/profile/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });

      if (!response.ok) throw new Error('Failed to disconnect');

      const updated = connectedAccounts.filter((acc) => acc.provider !== providerId);
      onUpdate({ verifiedAccounts: updated });
      toast.success(`${providerId} disconnected`, { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error(`Could not disconnect ${providerId}`, { id: toastId });
    }
  };

  const connectedProviders = connectedAccounts.map((acc) => acc.provider);

  return (
    <div className="space-y-6 text-sm">
      <div>
        <h1 className="text-xl font-semibold">Verified Accounts</h1>
        <p className="text-gray-500 mt-1">Connect to platforms you control to verify your identity.</p>
      </div>

      {/* Connected Display */}
      <div className="space-y-2">
        <AnimatePresence>
          {connectedAccounts.map((acc) => {
            const service = services.find((s) => s.id === acc.provider);
            if (!service) return null;

            const Icon = service.icon;

            return (
              <motion.div
                key={acc.provider}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between bg-gray-100 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{service.name}</span>
                  <VerifiedTick isPro={user.isProUser} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDisconnect(service.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {connectedAccounts.length === 0 && (
          <p className="text-gray-400 text-center">No verified accounts yet.</p>
        )}
      </div>


      {/* Connectable Services */}
      <div className="space-y-2 pt-2">
        <p className="font-medium mb-2">Add new account</p>
        {services.map((service) => {
          const isConnected = connectedProviders.includes(service.id);
          const Icon = service.icon;

          if (isConnected) return null;

          return (
            <button
              key={service.id}
              onClick={() => handleConnect(service.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-gray-100 hover:bg-gray-200 transition"
            >
              <Icon className="h-4 w-4" />
              {service.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
