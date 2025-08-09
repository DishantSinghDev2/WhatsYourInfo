'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import Switch from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// --- Data Definitions ---
const PLAN_LIMITS = {
  ['FREE']: {
    posts: 20,
    members: 1,
    viewsPerMonth: 2500,
    categories: 5,   // <-- New Limit
    tagsPerPost: 3,  // <-- New Limit
  },
  ['GROWTH']: {
    posts: Infinity,
    members: 5,
    viewsPerMonth: 50000,
    categories: 20,  // <-- New Limit
    tagsPerPost: 10, // <-- New Limit
  },
  ['SCALE']: {
    posts: Infinity,
    members: 15,
    viewsPerMonth: 250000,
    categories: Infinity, // <-- New Limit
    tagsPerPost: Infinity, // <-- New Limit
  },
  ['CUSTOM']: {
    posts: Infinity,
    members: Infinity,
    viewsPerMonth: Infinity,
    categories: Infinity, // <-- New Limit
    tagsPerPost: Infinity, // <-- New Limit
  },
};
const plans = [
    { id: 'FREE', name: 'Free', price: { usd: 0, inr: 0 }, desc: 'For individuals starting out.' },
    { id: 'GROWTH', name: 'Growth', price: { usd: 9, inr: 499 }, desc: 'For growing blogs and creators.' },
    { id: 'SCALE', name: 'Scale', price: { usd: 29, inr: 1499 }, desc: 'For businesses and power users.' },
    { id: 'CUSTOM', name: 'Custom', price: { usd: null, inr: null }, desc: 'For enterprise needs.' },
];

// --- The Main Component ---
export default function DITBlogsPricingPage() {
    const router = useRouter();
    const [isYearly, setIsYearly] = useState(false);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [userCountry, setUserCountry] = useState<'IN' | 'OTHER'>('OTHER');
    
    // Fetch user's country on component mount
    useEffect(() => {
        fetch('/api/geo') // A simple API to get geo info
            .then(res => res.json())
            .then(data => {
                if (data.country === 'IN') {
                    setUserCountry('IN');
                }
            }).catch(() => setUserCountry('OTHER'));
    }, []);

    const currency = userCountry === 'IN' ? 'inr' : 'usd';
    const currencySymbol = userCountry === 'IN' ? '₹' : '$';

    const handlePayment = async (plan: 'GROWTH' | 'SCALE') => {
        setIsLoading(plan);
        if (userCountry === 'IN') {
            await handleRazorpayPayment(plan);
        } else {
            await handlePayPalPayment(plan);
        }
        setIsLoading(null);
    };
    
    const handlePayPalPayment = async (plan: 'GROWTH' | 'SCALE') => {
        try {
            const res = await fetch('/api/ditblogs/paypal/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, yearly: isYearly }),
            });
            const data = await res.json();
            if (res.ok && data.approvalUrl) {
                router.push(data.approvalUrl);
            } else {
                toast.error(data.error || 'Failed to start PayPal checkout.');
            }
        } catch (e) { toast.error("An error occurred."); }
    };

    const handleRazorpayPayment = async (plan: 'GROWTH' | 'SCALE') => {
        try {
            const res = await fetch('/api/ditblogs/razorpay/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, yearly: isYearly }),
            });
            const { subscriptionId, keyId } = await res.json();
            if (!subscriptionId) {
                throw new Error('Could not create Razorpay subscription.');
            }

            const options = {
                key: keyId,
                subscription_id: subscriptionId,
                name: 'DITBlogs on WYI',
                description: `DITBlogs ${plan} Plan`,
                handler: function (response: any) {
                    // This function is called on successful payment
                    toast.success('Subscription successful!');
                    router.push('/dashboard/ditblogs?sub_id=' + response.razorpay_subscription_id);
                },
                prefill: {
                    // Optional: Prefill user details
                    // name: "Your Name",
                    // email: "your.email@example.com",
                },
                theme: { color: '#3B82F6' },
            };
            
            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payment failed.");
        }
    };


    return (
        <>
            {/* Include Razorpay script for Indian users */}
            {userCountry === 'IN' && (
                <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            )}
            <div className="min-h-screen bg-white">
                <Header />
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Hero Section */}
                    <div className="py-24 text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">DITBlogs Pricing</h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">Powerful blogging, simple pricing. Choose your plan.</p>
                        <div className="mt-10 flex items-center justify-center space-x-4">
                            <Label>Monthly</Label>
                            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                            <Label>Yearly <span className="text-green-600 font-medium">(Save 15%)</span></Label>
                        </div>
                    </div>
                    
                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {plans.map(plan => (
                            <Card key={plan.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <p className="text-gray-500 text-sm">{plan.desc}</p>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col justify-between">
                                    <div>
                                        <div className="mb-6">
                                            {plan.price[currency] !== null ? (
                                                <>
                                                    <span className="text-4xl font-bold">{currencySymbol}{isYearly ? plan.price[currency]! * 12 * 0.85 : plan.price[currency]}</span>
                                                    <span className="text-gray-500">/{isYearly ? 'year' : 'month'}</span>
                                                </>
                                            ) : (
                                                <span className="text-3xl font-bold">Let's Talk</span>
                                            )}
                                        </div>
                                        <ul className="space-y-3 text-sm">
                                            {Object.entries(PLAN_LIMITS[plan.id as keyof typeof PLAN_LIMITS]).map(([key, value]) => (
                                                <li key={key} className="flex items-center">
                                                    <Check className="h-4 w-4 text-green-500 mr-2" />
                                                    <span>{value === Infinity ? 'Unlimited' : value} {key}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mt-8">
                                        {plan.id === 'FREE' ? (
                                            <Link href="/register?product=ditblogs" className="w-full"><Button variant="outline" className="w-full">Get Started</Button></Link>
                                        ) : plan.id === 'CUSTOM' ? (
                                            <Link href="/contact?subject=DITBlogs Custom Plan" className="w-full"><Button className="w-full">Contact Sales</Button></Link>
                                        ) : (
                                            <Button
                                                className="w-full"
                                                disabled={!!isLoading}
                                                onClick={() => handlePayment(plan.id as 'GROWTH' | 'SCALE')}
                                            >
                                                {isLoading === plan.id ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                                                Choose {plan.name}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}