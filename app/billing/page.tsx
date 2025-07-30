// app/dashboard/billing/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import { Loader2, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { User } from '@/lib/auth';

// Define types for the billing data we expect from the API
interface BillingDetails {
  plan: { name: string; status: string; nextBillingDate: string | null; isCanceling: boolean; };
  paymentMethod: { brand: string; last4: string; };
  billingHistory: Array<{ id: string; date: string; amount: string; status: string; url: string | null; }>;
}

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (!response.ok) throw new Error('Auth failed');
        const data = await response.json();
        setUser(data.user);
        if (data.user.isProUser) {
          fetchBillingDetails();
        } else {
          setIsLoading(false);
        }
      } catch {
        router.push('/login');
      }
    };
    fetchUserData();
  }, [router]);

  const fetchBillingDetails = async () => {
    try {
      const response = await fetch('/api/billing/details');
      if (!response.ok) throw new Error('Could not fetch details');
      const data = await response.json();
      setBillingDetails(data);
    } catch {
      toast.error('Could not load billing information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    toast.loading('Redirecting to PayPal...');
    try {
        const response = await fetch('/api/billing/manage', { method: 'POST' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        // Open PayPal in a new tab
        window.open(data.url, '_blank');
        toast.dismiss();
        toast.success('Opened PayPal in a new tab.');
    } catch (error) {
        toast.dismiss();
        toast.error(error instanceof Error ? error.message : "Could not open management portal.");
    } finally {
        setIsManaging(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your plan, payment methods, and view your invoice history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.isProUser && billingDetails ? (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-semibold text-gray-800">{billingDetails.plan.name}</span>
                    <span className={`px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full capitalize`}>{billingDetails.plan.status}</span>
                  </div>
                  <div className="text-sm space-y-2 pt-4 border-t">
                    <div className="flex justify-between"><span className="text-gray-500">Payment Via:</span> <span className="font-medium">{billingDetails.paymentMethod.brand}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Next Bill:</span> <span className="font-medium">{billingDetails.plan.nextBillingDate ? new Date(billingDetails.plan.nextBillingDate).toLocaleDateString() : 'N/A'}</span></div>
                  </div>
                  {billingDetails.plan.isCanceling && <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">Your plan has been canceled and will expire on the next billing date.</p>}
                  <Button onClick={handleManageSubscription} disabled={isManaging} className="w-full">
                    {isManaging ? 'Opening...' : 'Manage on PayPal'}
                  </Button>
                  <p className="text-xs text-center text-gray-500">You will be redirected to PayPal to manage your subscription.</p>
                </>
              ) : (
                 <>
                  <div className="flex justify-between items-baseline"><span className="text-lg font-semibold text-gray-800">Free Plan</span></div>
                  <p className="text-sm text-gray-600 pt-4 border-t">You are currently on the Free plan. Upgrade to unlock Pro features.</p>
                  <Button onClick={() => router.push('/pricing')} className="w-full"><Crown className="h-4 w-4 mr-2" />Upgrade to Pro</Button>
                 </>
              )}
            </CardContent>
          </Card>
          
          {/* Billing History Card */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent transactions via PayPal.</CardDescription>
            </CardHeader>
            <CardContent>
              {billingDetails && billingDetails.billingHistory.length > 0 ? (
                <ul className="space-y-3 max-h-80 overflow-y-auto">
                  {billingDetails.billingHistory.map(txn => (
                    <li key={txn.id} className="flex justify-between items-center text-sm pr-2">
                      <div>
                        <p className="font-medium text-gray-800">${txn.amount}</p>
                        <p className="text-xs text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-medium text-gray-500 capitalize">{txn.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-gray-500 py-8">No transaction history found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}