// app/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { User as AuthUser } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmailSettingsPanel } from '@/components/settings/EmailSettingsPanel';
import { PasswordSettingsPanel } from '@/components/settings/PasswordSettingsPanel';
import { ConnectedAppsPanel } from '@/components/settings/ConnectedAppsPanel';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (!res.ok) {
          if (res.status === 401) router.push('/login');
          throw new Error('Please sign in to view settings.');
        }
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not load user data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!user) return null; // Or a login prompt component

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account, password, and application connections.</p>
        </div>

        <div className="space-y-10">
          <EmailSettingsPanel user={user} />
          <PasswordSettingsPanel />
          <ConnectedAppsPanel />
        </div>
      </main>
    </div>
  );
}