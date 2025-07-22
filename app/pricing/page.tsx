import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, X, Sparkles, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individuals getting started',
    icon: CheckCircle,
    features: [
      'username.whatsyour.info profile page',
      'Profile photo (Gravatar-style)',
      'Bio and social links',
      'Contact information',
      'Email signature generator',
      'Basic analytics',
      'Community support',
    ],
    limitations: [
      'What\'sYour.Info branding',
      'No custom domain',
      'No spotlight CTA button',
      'No lead capture forms',
    ],
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
    icon: Crown,
    features: [
      'Everything in Free',
      'Custom domain (yourname.com)',
      'Remove What\'sYour.Info branding',
      'Customizable "Spotlight" CTA button',
      'Lead capture forms',
      'Appointment scheduler (Calendly-style)',
      'Embedded image/video gallery',
      'Advanced analytics',
      'Priority support',
      'AI profile enhancement',
      'Custom themes and styling',
      'SEO optimization tools',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    ctaHref: '/register?plan=pro',
    popular: true,
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
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. Start free, upgrade when you're ready.
              No hidden fees, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center space-x-1 rounded-full bg-blue-600 px-4 py-1 text-sm font-medium text-white">
                      <Sparkles className="h-4 w-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <plan.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                    {plan.yearlyPrice && (
                      <div className="mt-2 text-sm text-gray-500">
                        or {plan.yearlyPrice}/year (save 17%)
                      </div>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Link href={plan.ctaHref}>
                    <Button 
                      className={`w-full mb-6 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">What's included:</h4>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="font-medium text-gray-900 mt-6">Limitations:</h4>
                        {plan.limitations.map((limitation, index) => (
                          <div key={index} className="flex items-start">
                            <X className="h-4 w-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                            <span className="text-sm text-gray-500">{limitation}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

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

      <Footer />
    </div>
  );
}