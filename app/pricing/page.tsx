import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check, HelpCircle, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useState } from 'react';


const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individuals getting started',
    cta: 'Get Started Free',
    ctaHref: '/register',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$6',
    period: 'per month',
    yearlyPrice: '$59',
    description: 'For professionals who want more control',
    cta: 'Start Pro Trial',
    ctaHref: '/register?plan=pro',
    popular: true,
  },
];

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
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);

  const handleProClick = async () => {
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'Pro', yearly: isYearly }),
      });

      const data = await res.json();
      if (data.id) {
        // Redirect to a dedicated PayPal processing page
        router.push(`/paypal/checkout?orderID=${data.id}`);
      } else {
        // Handle error
        console.error('Failed to create PayPal order');
      }
    } catch (error) {
      console.error('Error initiating PayPal payment:', error);
    }
  };

  return (
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
            No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Comparison Table */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto py-4">
            <div className="col-span-1"></div> {/* Empty cell for alignment */}
            {plans.map((plan) => (
              <div key={plan.name} className="text-center">
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="text-sm text-gray-500">{plan.description}</p>
                 <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                    {plan.yearlyPrice && (
                      <div className="mt-1 text-xs text-gray-500">
                        or {plan.yearlyPrice}/year
                      </div>
                    )}
                  </div>
                <Link href={plan.ctaHref}>
                  <Button className={`w-full mt-4 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
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
  );
}