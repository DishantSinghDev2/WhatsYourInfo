'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check, HelpCircle, Loader2, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Switch from '@/components/ui/switch'; // Assuming you have a Switch component from shadcn/ui
import { Label } from '@/components/ui/label';   // Assuming you have a Label component
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import Script from 'next/script';


const featureCategories = [
  {
    name: 'Profile',
    features: [
      { name: 'username.whatsyour.info profile page', inFree: true, inPro: true },
      { name: 'Profile photo (Gravatar-style)', inFree: true, inPro: true },
      { name: 'Bio and social links', inFree: true, inPro: true },
      { name: 'Contact information', inFree: true, inPro: true },
      { name: 'Custom domain (yourname.com)', inFree: false, inPro: true, tooltip: 'Connect your own domain for a fully branded experience.' },
      { name: 'Remove What\'sYour.Info branding', inFree: false, inPro: true },
    ],
  },
  {
    name: 'Engagement',
    features: [
      { name: 'Customizable "Spotlight" CTA button', inFree: false, inPro: true, tooltip: 'A prominent call-to-action button to direct visitors.' },
      { name: 'Lead capture forms', inFree: false, inPro: true },
      { name: 'Appointment scheduler (Calendly-style)', inFree: false, inPro: true },
      { name: 'Embedded image/video gallery', inFree: false, inPro: true },
    ],
  },
  {
    name: 'Advanced',
    features: [
      { name: 'Email signature generator', inFree: true, inPro: true },
      { name: 'Basic analytics', inFree: true, inPro: 'Advanced' },
      { name: 'AI profile enhancement', inFree: false, inPro: true, tooltip: 'Use AI to help write your bio and enhance your profile.' },
      { name: 'Custom themes and styling', inFree: false, inPro: true },
      { name: 'SEO optimization tools', inFree: false, inPro: true },
    ],
  },
  {
    name: 'Support & API',
    features: [
      { name: 'Community support', inFree: true, inPro: true },
      { name: 'Priority support', inFree: false, inPro: true },
      { name: 'Developer API', inFree: true, inPro: true, tooltip: 'Integrate What\'sYour.Info authentication into your apps.' },
    ],
  },
];

const faq = [
  {
    question: 'How does the free plan work?',
    answer: 'Our free plan includes everything you need to create a professional profile at username.whatsyour.info. You can add your bio, social links, contact information, and even generate email signatures. The only limitation is that you\'ll have What\'sYour.Info branding on your profile.',
  },
  {
    question: 'Can I use my own domain name?',
    answer: 'Yes! Pro users can connect their own custom domain (like yourname.com) and have it point to their What\'sYour.Info profile. We provide easy DNS setup instructions and handle all the technical details.',
  },
  {
    question: 'What is the Developer API?',
    answer: 'Our Developer API allows you to integrate What\'sYour.Info authentication into your applications. Users can sign in to your app using their What\'sYour.Info identity, similar to "Sign in with Google". Both free and pro users have access to developer features.',
  },
  {
    question: 'How does billing work for Pro plans?',
    answer: 'Pro plans are billed monthly at $6/month or annually at $59/year (saving you 2 months). You can cancel anytime and your account will remain Pro until the end of your billing period.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Absolutely! You can upgrade to Pro anytime and start using premium features immediately. If you downgrade, you\'ll keep Pro features until your current billing period ends.',
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userCountry, setUserCountry] = useState<'IN' | 'OTHER'>('OTHER'); // State for user's country


  const showCancel = searchParams.get('paypal_cancel') === 'true';
  const subId = searchParams.get('subscription_id');

  const handleClose = () => {
    // rebuild URL without params to clean the UI
    router.replace(pathname);
  };

  // --- NEW: Fetch user's country on component mount ---
  useEffect(() => {
    setIsLoading(true); // Show loader while we detect location
    fetch('/api/geo')
      .then(res => res.json())
      .then(data => {
        if (data.country === 'IN') {
          setUserCountry('IN');
        }
      }).catch(() => {
        // Default to OTHER if the API fails
        setUserCountry('OTHER');
      }).finally(() => {
        setIsLoading(false);
      });
  }, []);

  // --- NEW: Define pricing for both regions ---
  const pricingData = {
    monthly: { usd: 6, inr: 149 },
    yearly: { usd: 59, inr: 1499 },
  };
  const currency = userCountry === 'IN' ? 'inr' : 'usd';
  const currencySymbol = userCountry === 'IN' ? '₹' : '$';

  // --- NEW: Refactored Payment Handler Logic ---

  // Main handler that decides which payment gateway to use
  const handleProClick = async () => {
    setIsLoading(true);
    setError(null);
    if (userCountry === 'IN') {
      await handleRazorpayPayment();
    } else {
      await handlePayPalPayment();
    }
    setIsLoading(false);
  };

  // Existing PayPal logic
  const handlePayPalPayment = async () => {
    try {
      const res = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yearly: isYearly }),
      });
      const data = await res.json();
      if (res.ok && data.approvalUrl) {
        router.push(data.approvalUrl);
      } else if (res.status === 401) {
        router.push('/login?callbackUrl=/pricing');
      } else {
        throw new Error(data.error || 'Failed to create PayPal subscription.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  // New Razorpay logic
  const handleRazorpayPayment = async () => {
    try {
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yearly: isYearly }),
      });

      if (res.status === 401) {
        router.push('/login?callbackUrl=/pricing');
        return;
      }

      const { subscriptionId, keyId } = await res.json();
      if (!subscriptionId) throw new Error('Could not create Razorpay subscription.');

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'WhatsYour.Info Pro',
        description: `WYI Pro Plan - ${isYearly ? 'Yearly' : 'Monthly'}`,
        handler: function (response: any) {
          toast.success('Subscription successful! Welcome to Pro.');
          router.push('/dashboard?razorpay_success=true&sub_id=' + response.razorpay_subscription_id);
        },
        theme: { color: '#2563EB' }, // Blue-600
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (error) {
      setError(error instanceof Error ? error.message : "Payment failed.");
    }
  };

  // --- Dynamic plan object based on state ---
  const proPlan = {
    name: 'Pro',
    price: `${currencySymbol}${pricingData[isYearly ? 'yearly' : 'monthly'][currency]}`,
    period: isYearly ? 'year' : 'month',
    description: 'For professionals who want more control',
    cta: 'Start 14-Day Free Trial',
  };

  const freePlan = {
    name: 'Free',
    price: `${currencySymbol}0}`,
    period: 'forever',
    description: 'Perfect for individuals getting started',
    cta: 'Get Started Free',
    ctaHref: '/register',
    popular: false,
  };

  return (
    <>
      {userCountry === 'IN' && (
        <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      )}
      <div className="min-h-screen bg-white">
        <Header />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="py-24 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. Start free, upgrade when you're ready.
            </p>

            {/* Monthly/Yearly Toggle */}
            <div className="mt-10 flex items-center justify-center space-x-4">
              <Label htmlFor="billing-cycle" className={!isYearly ? 'text-blue-600' : 'text-gray-500'}>Monthly</Label>
              <Switch
                id="billing-cycle"
                checked={isYearly}
                onChange={setIsYearly} />
              <Label htmlFor="billing-cycle" className={isYearly ? 'text-blue-600' : 'text-gray-500'}>
                Yearly <span className="text-green-600 font-medium">(Save 2 months)</span>
              </Label>
            </div>
          </div>

          {/* --- UPDATED: Pricing Comparison Table --- */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
            <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto py-4">
              <div className="col-span-1">
              </div> {/* Empty cell for alignment */}

              {/* Free Plan Column */}
              <div className="text-center">
                <h2 className="text-xl font-bold">{freePlan.name}</h2>
                <p className="text-sm text-gray-500">{freePlan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{freePlan.price}</span>
                </div>
                <Link href={freePlan.ctaHref!}>
                  <Button className="w-full mt-4" variant="outline">
                    {freePlan.cta}
                  </Button>
                </Link>
              </div>

              {/* UPDATED Pro Plan Column */}
              <div className="text-center">
                <h2 className="text-xl font-bold">{proPlan.name}</h2>
                <p className="text-sm text-gray-500">{proPlan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{proPlan.price}</span>
                  <span className="text-gray-600">/{proPlan.period}</span>
                </div>
                <Button
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={handleProClick}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {proPlan.cta}
                </Button>
              </div>
            </div>
            {error && <p className="text-center text-red-500 text-sm mt-2">{error}</p>}
            <div className="h-px bg-gray-200 max-w-5xl mx-auto"></div>
          </div>

          <div className="max-w-5xl mx-auto">
            {featureCategories.map((category) => (
              <div key={category.name} className="py-8">
                <h3 className="text-lg font-semibold mb-4">{category.name}</h3>
                <div className="space-y-4">
                  {category.features.map((feature) => (
                    <div key={feature.name} className="grid grid-cols-3 gap-8 items-center">
                      <div className="col-span-1 flex items-center">
                        <p className="text-sm text-gray-800">{feature.name}</p>
                        {feature.tooltip && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-gray-400 ml-2" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{feature.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="col-span-1 text-center">
                        {typeof feature.inFree === 'boolean' ? (
                          feature.inFree ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-gray-400 mx-auto" />
                        ) : (
                          <span className="text-sm text-gray-600">{feature.inFree}</span>
                        )}
                      </div>
                      <div className="col-span-1 text-center">
                        {typeof feature.inPro === 'boolean' ? (
                          feature.inPro ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-gray-400 mx-auto" />
                        ) : (
                          <span className="text-sm text-gray-600">{feature.inPro}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* FAQ Section */}
          <section className="py-24 bg-gray-50">
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  Frequently asked questions
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Got questions? We've got answers.
                </p>
              </div>
              <div className="mt-16 space-y-8">
                {faq.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {item.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-blue-600">
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Still have questions?
                </h2>
                <p className="mt-4 text-lg text-blue-100">
                  Our team is here to help you choose the right plan
                </p>
                <div className="mt-8">
                  <Link href="/contact">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
      <Dialog open={showCancel} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogTitle>Subscription Cancelled</DialogTitle>
          <DialogDescription>
            {subId
              ? `Your PayPal subscription (${subId}) was cancelled before confirmation.`
              : `You cancelled the subscription process.`}
          </DialogDescription>

          <DialogClose asChild>
            <button className="mt-4 inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-white">
              Try Again
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}