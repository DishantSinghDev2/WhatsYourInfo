import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Code,
  Zap,
  Shield,
  Key,
  Globe,
  Database,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const quickStartSteps = [
  {
    step: 1,
    title: 'Create Your Account',
    description: 'Sign up for a free What\'sYour.Info account and create your profile',
    code: 'curl -X POST https://whatsyour.info/api/auth/register',
  },
  {
    step: 2,
    title: 'Get Your API Key',
    description: 'Visit your developer dashboard to generate API keys for your applications',
    code: 'const apiKey = "wyi_live_1234567890abcdef";',
  },
  {
    step: 3,
    title: 'Make Your First Call',
    description: 'Fetch public profile data using our REST API',
    code: 'fetch("https://whatsyour.info/api/public/profile/username")',
  },
];

const apiEndpoints = [
  {
    method: 'GET',
    endpoint: '/api/public/profile/{username}',
    description: 'Get public profile information',
    auth: 'None',
  },
  {
    method: 'POST',
    endpoint: '/api/auth/login',
    description: 'Authenticate a user',
    auth: 'API Key',
  },
  {
    method: 'GET',
    endpoint: '/api/auth/user',
    description: 'Get authenticated user data',
    auth: 'Bearer Token',
  },
  {
    method: 'PUT',
    endpoint: '/api/auth/profile',
    description: 'Update user profile',
    auth: 'Bearer Token',
  },
];

const sdks = [
  {
    language: 'JavaScript',
    description: 'Official JavaScript/Node.js SDK with full TypeScript support',
    install: 'npm install @whatsyour/info-js',
    icon: Code,
  },
  {
    language: 'Python',
    description: 'Python SDK for easy integration with Django and Flask apps',
    install: 'pip install whatsyour-info',
    icon: Code,
  },
  {
    language: 'PHP',
    description: 'PHP SDK for Laravel, Symfony, and vanilla PHP projects',
    install: 'composer require whatsyour/info-php',
    icon: Code,
  },
  {
    language: 'Go',
    description: 'Go SDK for high-performance applications',
    install: 'go get github.com/whatsyour/info-go',
    icon: Code,
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Developer Documentation
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Everything you need to integrate What'sYour.Info into your applications. 
              From simple profile lookups to full SSO implementation.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Link href="/dev">
                <Button size="lg">
                  Get API Key
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#quickstart">
                <Button variant="outline" size="lg">
                  Quick Start Guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quickstart" className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Quick Start Guide
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get up and running in minutes
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {quickStartSteps.map((step) => (
              <Card key={step.step} className="border-gray-200">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                      {step.step}
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {step.description}
                  </CardDescription>
                  <code className="block bg-gray-100 p-3 rounded-lg text-sm text-gray-800 overflow-x-auto">
                    {step.code}
                  </code>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              API Reference
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Complete REST API documentation
            </p>
          </div>
          
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Core Endpoints
              </CardTitle>
              <CardDescription>
                Base URL: https://whatsyour.info/api
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 font-semibold text-gray-900">Method</th>
                      <th className="pb-3 font-semibold text-gray-900">Endpoint</th>
                      <th className="pb-3 font-semibold text-gray-900">Description</th>
                      <th className="pb-3 font-semibold text-gray-900">Auth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiEndpoints.map((endpoint, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            endpoint.method === 'GET' 
                              ? 'bg-green-100 text-green-800'
                              : endpoint.method === 'POST'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {endpoint.method}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-sm text-gray-700">
                          {endpoint.endpoint}
                        </td>
                        <td className="py-3 text-gray-600">
                          {endpoint.description}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            endpoint.auth === 'None'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {endpoint.auth}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SDKs */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Official SDKs
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              First-class libraries for your favorite languages
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sdks.map((sdk) => (
              <Card key={sdk.language} className="border-gray-200 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <sdk.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <CardTitle className="text-lg">{sdk.language}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {sdk.description}
                  </CardDescription>
                  <code className="block bg-gray-100 p-2 rounded text-sm text-gray-800 break-all">
                    {sdk.install}
                  </code>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Platform Features
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built for developers, designed for scale
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-gray-200">
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-3" />
                <CardTitle>Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  OAuth 2.0, JWT tokens, rate limiting, and enterprise-grade security 
                  features built-in.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200">
              <CardHeader>
                <Zap className="h-8 w-8 text-yellow-600 mb-3" />
                <CardTitle>High Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Redis caching, CDN distribution, and optimized queries for 
                  sub-100ms response times.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200">
              <CardHeader>
                <Globe className="h-8 w-8 text-green-600 mb-3" />
                <CardTitle>Global Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Edge locations worldwide, 99.9% uptime SLA, and automatic 
                  scaling for any load.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ready to build something amazing?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Get your API key and start integrating in minutes
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Link href="/dev">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Get API Key
                  <Key className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Create Account
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