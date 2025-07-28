// app/dashboard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import {
  BarChart3,
  ExternalLink,
  Users,
  CreditCard,
  Code,
  Settings,
  Crown,
  Loader2,
  Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { User as AuthUser } from '@/lib/auth';

// Type for the data we expect from our new API endpoint
interface DashboardStats {
  profileViews: number;
  newLeads: number;
  accountPlan: 'Pro' | 'Free';
}

// A reusable card component for displaying stats
const StatCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userResponse = await fetch('/api/auth/user');
        if (!userResponse.ok) {
          if (userResponse.status === 401) router.push('/login');
          throw new Error('Please sign in to continue.');
        }
        const userData = await userResponse.json();
        setUser(userData.user);

        // Fetch aggregated stats from our new endpoint
        const statsResponse = await fetch('/api/dashboard/stats');
        if (!statsResponse.ok) throw new Error('Could not load dashboard stats.');
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [router]);

  const handleLogout = async () => {
    toast.loading('Signing out...');
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.dismiss();
    router.push('/login');
  };

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

  if (!user || !stats) {
    // This state can be reached if there was an error fetching data
    return (
        <div className="min-h-screen bg-gray-50">
           <Header />
           <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
               <p className="text-gray-600">Could not load dashboard. Please try again later.</p>
           </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.firstName}!</h1>
            <p className="text-gray-600">Here's your account summary for the last 30 days.</p>
          </div>
          <div className="flex items-center space-x-2">
             <Button variant="outline" asChild>
                <a href={`/${user.username}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> View Public Profile
                </a>
             </Button>
             <Button variant="ghost" onClick={handleLogout}>Sign Out</Button>
          </div>
        </div>

        {/* --- LIVE STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Profile Views"
            value={stats.profileViews.toLocaleString()}
            icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
            description="Views in the last 30 days"
          />
          <StatCard 
            title="New Leads"
            value={user.isProUser ? stats.newLeads : 'N/A'}
            icon={<Users className="h-5 w-5 text-green-600" />}
            description={user.isProUser ? "Leads in the last 30 days" : "Upgrade to Pro to capture leads"}
          />
          <StatCard
            title="Account Plan"
            value={stats.accountPlan}
            icon={<Crown className={`h-5 w-5 ${user.isProUser ? 'text-yellow-500' : 'text-gray-400'}`} />}
            description={user.isProUser ? "You have access to all features" : "Limited access"}
          />
        </div>

        {/* --- NAVIGATION GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/profile" className="block p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
            <Settings className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-lg">Edit Profile & Design</h3>
            <p className="text-sm text-gray-500">Update your name, bio, links, and page design.</p>
          </Link>
          <Link href="/analytics" className="block p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
            <BarChart3 className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-lg">View Analytics</h3>
            <p className="text-sm text-gray-500">Track detailed profile views and visitor insights.</p>
          </Link>
          <Link href="/billing" className="block p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
            <CreditCard className="h-8 w-8 text-red-600 mb-3" />
            <h3 className="font-semibold text-lg">Billing & Plan</h3>
            <p className="text-sm text-gray-500">Manage your subscription, invoices, and payment methods.</p>
          </Link>
          {user.isProUser ? (
             <Link href="/leads" className="block p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
              <Users className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-lg">Manage Leads</h3>
              <p className="text-sm text-gray-500">View and export contacts from your profile.</p>
            </Link>
          ) : (
             <Link href="/pricing" className="block p-6 bg-yellow-50 border border-yellow-300 rounded-lg hover:shadow-md transition-shadow">
                <Crown className="h-8 w-8 text-yellow-500 mb-3" />
                <h3 className="font-semibold text-lg">Upgrade to Pro</h3>
                <p className="text-sm text-gray-600">Unlock lead capture, custom domains, and more.</p>
            </Link>
          )}
          <Link href="/dev" className="block p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
            <Code className="h-8 w-8 text-gray-800 mb-3" />
            <h3 className="font-semibold text-lg">Developer Tools</h3>
            <p className="text-sm text-gray-500">Create API keys and OAuth applications.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}