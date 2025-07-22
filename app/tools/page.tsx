import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Mail,
  Palette,
  Code,
  Globe,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const tools = [
  {
    name: 'Email Signature Generator',
    description: 'Create professional email signatures with your profile information',
    icon: Mail,
    href: '/tools/email-signature',
    color: 'bg-blue-100 text-blue-600',
    available: true,
  },
  {
    name: 'QR Code Generator',
    description: 'Generate QR codes for your profile to share offline',
    icon: Code,
    href: '/tools/qr-code',
    color: 'bg-purple-100 text-purple-600',
    available: false,
  },
  {
    name: 'Social Media Kit',
    description: 'Download branded assets for your social media profiles',
    icon: Palette,
    href: '/tools/social-kit',
    color: 'bg-green-100 text-green-600',
    available: false,
  },
  {
    name: 'Link Shortener',
    description: 'Create short links that redirect to your profile',
    icon: Globe,
    href: '/tools/link-shortener',
    color: 'bg-yellow-100 text-yellow-600',
    available: false,
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Professional Tools
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Enhance your digital presence with our suite of professional tools designed 
              to help you create, share, and manage your online identity.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {tools.map((tool) => (
              <Card 
                key={tool.name} 
                className={`border-gray-200 hover:border-blue-300 transition-colors group ${
                  !tool.available ? 'opacity-60' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tool.color}`}>
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{tool.name}</CardTitle>
                      {!tool.available && (
                        <div className="flex items-center mt-1">
                          <Sparkles className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm text-yellow-600">Coming Soon</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {tool.description}
                  </CardDescription>
                  {tool.available ? (
                    <Link href={tool.href}>
                      <Button className="w-full group-hover:bg-blue-700">
                        Use Tool
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
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
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Need a custom tool?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Let us know what tools would help you manage your digital identity better
            </p>
            <div className="mt-8">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Request a Tool
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