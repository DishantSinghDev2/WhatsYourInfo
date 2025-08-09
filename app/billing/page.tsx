'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import { Loader2, Crown, Package, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Define a standardized type for ANY subscription
interface SubscriptionDetails {
  productName: string;
  plan: {
    name: string;
    status: string;
    nextBillingDate: string | null;
    isCanceling: boolean;
    provider: 'paypal' | 'razorpay';
  };
  paymentMethod: { brand: string; last4: string; };
  billingHistory: Array<{
    id: string; date: string; amount: string; currency: string; status: string;
  }>;
}

// The API will return an object where keys are product IDs
type AllBillingDetails = Record<string, SubscriptionDetails>;

export default function BillingPage() {
  const router = useRouter();
  const [allDetails, setAllDetails] = useState<AllBillingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // --- MODIFIED: State to track which specific subscription is being managed ---
  const [isManaging, setIsManaging] = useState<string | null>(null); // Will store the productKey

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/billing/details')
      .then(res => {
        if (!res.ok) throw new Error('Not logged in or no subscriptions found.');
        return res.json();
      })
      .then(data => setAllDetails(data))
      .catch(() => setAllDetails({})) // Set to empty object on error/no data
      .finally(() => setIsLoading(false));
  }, []);

  // --- THE CORRECTED HANDLER ---
  const handleManageSubscription = async (productKey: string, provider: 'paypal' | 'razorpay') => {
    // Disable the button for the specific product being managed
    setIsManaging(productKey);

    if (provider === 'razorpay') {
      // Razorpay doesn't have a direct-to-subscription portal link via API,
      // so we send them to the main customer portal.
      toast.success('Opening Razorpay Customer Portal...');
      window.open('https://dashboard.razorpay.com/customer/subscriptions', '_blank');
      setIsManaging(null); // Re-enable the button
      return;
    }

    // For PayPal, we can use our new API
    toast.loading('Redirecting to PayPal...');
    try {
      const response = await fetch('/api/billing/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the key of the product we want to manage
        body: JSON.stringify({ productKey }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get management URL.");

      window.open(data.url, '_blank');
      toast.dismiss();
      toast.success('Opened PayPal in a new tab.');

    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Could not open management portal.");
    } finally {
      setIsManaging(null); // Re-enable the button once done
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

  const hasSubscriptions = allDetails && Object.keys(allDetails).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage your plans and payment history across all products.</p>
        </div>

        {hasSubscriptions ? (
          <div className="space-y-12">
            {/* Map over each subscription and render a dedicated section */}
            {Object.entries(allDetails).map(([productKey, details]) => (
              <div key={productKey}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-3 text-blue-600" />
                  {details.productName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <Card>
                    <CardHeader>
                      <CardTitle>{details.plan.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-semibold text-gray-800">Current Plan</span>
                        <span className={`px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full capitalize`}>{details.plan.status}</span>
                      </div>
                      <div className="text-sm space-y-2 pt-4 border-t">
                        <div className="flex justify-between"><span className="text-gray-500">Provider:</span> <span className="font-medium capitalize">{details.plan.provider}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Next Bill:</span> <span className="font-medium">{details.plan.nextBillingDate ? new Date(details.plan.nextBillingDate).toLocaleDateString() : 'N/A'}</span></div>
                      </div>
                      {details.plan.isCanceling && <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">Your plan is set to cancel at the end of the current billing period.</p>}
                      {/* --- THE CORRECTED BUTTON CALL --- */}
                      <Button
                        onClick={() => handleManageSubscription(productKey, details.plan.provider)}
                        disabled={isManaging === productKey}
                        className="w-full"
                      >
                        {isManaging === productKey ? 'Opening...' : `Manage on ${details.plan.provider === 'paypal' ? 'PayPal' : 'Portal'}`}
                      </Button>

                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 max-h-80 overflow-y-auto">
                        {details.billingHistory.length > 0 ? details.billingHistory.map(txn => (
                          <li key={txn.id} className="flex justify-between items-center text-sm pr-2">
                            <div>
                              <p className="font-medium text-gray-800">{new Intl.NumberFormat('en-US', { style: 'currency', currency: txn.currency }).format(parseFloat(txn.amount))}</p>
                              <p className="text-xs text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                            </div>
                            <span className="text-xs font-medium text-gray-500 capitalize">{txn.status}</span>
                          </li>
                        )) : <p className="text-center text-sm text-gray-500 py-4">No history found.</p>}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <CardTitle>No Active Subscriptions</CardTitle>
            <CardDescription className="mt-2">You do not have any active subscriptions with us.</CardDescription>
            <Button onClick={() => router.push('/pricing')} className="mt-6"><Crown className="h-4 w-4 mr-2" />View Plans</Button>
          </Card>
        )}
      </main>
    </div>
  );
}
