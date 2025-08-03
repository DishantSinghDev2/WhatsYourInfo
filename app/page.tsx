import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Globe,
  Users,
  Shield,
  Zap,
  Code,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Palette,
} from 'lucide-react';

const features = [
  {
    icon: Globe,
    title: 'Universal Profile',
    description: 'One profile that works everywhere. Share your professional identity across platforms with username.whatsyour.info',
  },
  {
    icon: Shield,
    title: 'Secure Authentication',
    description: 'Built-in SSO capabilities for developers. Authenticate users across your applications with enterprise-grade security.',
  },
  {
    icon: Code,
    title: 'Developer API',
    description: 'Comprehensive API for integration. Fetch public profiles, manage authentication, and build amazing applications.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Smart profile enhancement with Google Gemini. Generate compelling bios and optimize your professional presence.',
  },
  {
    icon: Palette,
    title: 'Customizable',
    description: 'Brand your profile with custom domains, spotlight buttons, and personalized themes for Pro users.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Blazing fast performance with Redis caching and MongoDB. Your profiles load instantly worldwide.',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Senior Developer',
    company: 'TechCorp',
    content: 'What\'sYour.Info has become our go-to identity provider. The API is clean and the SSO integration was seamless.',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Marcus Johnson',
    role: 'Product Manager',
    company: 'StartupXYZ',
    content: 'The AI bio generator is incredible. It helped me create a professional profile in minutes instead of hours.',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Freelance Designer',
    company: 'Independent',
    content: 'Love the custom domain feature! My clients can easily find me at emilyrodriguez.com, powered by What\'sYour.Info.',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
  },
];

export default function HomePage() {
  

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] opacity-25" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your Unified{' '}
              <span className="text-gradient">Digital Identity</span>{' '}
              Platform
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Create your professional profile, manage your digital identity, and provide SSO authentication 
              for developers. All in one powerful platform trusted by thousands worldwide.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <Link href="/register">
                <Button size="lg" className="px-8 py-3 text-base">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" size="lg" className="px-8 py-3 text-base">
                  View Documentation
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex sm:flex-nowrap flex-wrap items-center justify-center space-x-4 sm:space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Free Forever Plan
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Developer-First API
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for digital identity
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From personal profiles to enterprise SSO, we've got you covered
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-gray-200 hover:border-blue-300 transition-colors group">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                        <feature.icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get started in minutes, not hours
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">1. Create Your Profile</h3>
              <p className="mt-2 text-gray-600">
                Sign up for free and create your professional profile with our AI-powered tools
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Palette className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">2. Customize & Share</h3>
              <p className="mt-2 text-gray-600">
                Personalize your profile and share it at username.whatsyour.info
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">3. Connect Everywhere</h3>
              <p className="mt-2 text-gray-600">
                Use your profile as a universal identity across platforms and applications
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Loved by developers and creators
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              See what people are saying about What'sYour.Info
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="pt-6">
                  <p className="text-gray-600 italic">"{testimonial.content}"</p>
                  <div className="mt-6 flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to create your digital identity?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join thousands of professionals and developers who trust What'sYour.Info
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-base">
                  Start Building Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 bg-blue-600 px-8 py-3 text-base">
                  View Pricing
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