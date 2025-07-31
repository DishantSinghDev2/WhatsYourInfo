// app/settings/security/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserProfile } from '@/types'; // Use the full UserProfile type
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { SettingsNav } from '@/components/settings/SettingsNav';
import { TwoFactorPanel } from '@/components/settings/TwoFactorPanel';
import { ActiveSessionsPanel } from '@/components/settings/ActiveSessionsPanel';
import { ConnectedAppsPanel } from '@/components/settings/ConnectedAppsPanel';
import { RecoveryEmailPanel } from '@/components/settings/RecoveryEmailPanel';
import { PasswordSettingsPanel } from '@/components/settings/PasswordSettingsPanel';

export default function SecurityPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch the full user profile which contains the 2FA status
        const fetchFullUser = async () => {
            try {
                const res = await fetch('/api/auth/profile'); // Use the full profile route
                if (!res.ok) {
                    if (res.status === 401) router.push('/login');
                    throw new Error('Please sign in to view security settings.');
                }
                const data = await res.json();
                setUser(data);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Could not load user data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFullUser();
    }, [router]);
    
    // While loading, show a full-page spinner
    if (isLoading) {
        return (
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                </div>
            </main>
          </div>
        );
    }

    // If loading is finished but the user object is still null, it means an error occurred.
    if (!user) {
        return (
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8 text-center">
                <p>Could not load your security settings. Please try logging in again.</p>
            </main>
          </div>
        );
    }

    // When data is loaded, render the page and pass the user prop correctly
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your password, two-factor authentication, active sessions, and application connections.</p>
                </div>
                
                <SettingsNav />

                <div className="space-y-10">
                    <PasswordSettingsPanel />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* FIX: Pass the loaded user object as a prop */}
                            <TwoFactorPanel user={user} />
                        </CardContent>
                    </Card>
                    
                    {/* FIX: Pass the loaded user object as a prop */}
                    <RecoveryEmailPanel user={user} />
                    
                    <ActiveSessionsPanel />
                    
                    <ConnectedAppsPanel />
                </div>
            </main>
        </div>
    );
}