'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Search,
  HelpCircle,
  Book,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

const categories = [
  {
    title: 'Getting Started',
    icon: Book,
    description: 'Learn the basics of What\'sYour.Info',
    articles: [
      { title: 'Creating Your First Profile', views: '12.5k', href: '#' },
      { title: 'Understanding Free vs Pro Features', views: '8.2k', href: '#' },
      { title: 'Setting Up Your Custom Domain', views: '6.1k', href: '#' },
      { title: 'Profile Customization Guide', views: '9.3k', href: '#' },
    ]
  },
  {
    title: 'Developer Resources',
    icon: MessageSquare,
    description: 'API documentation and integration guides',
    articles: [
      { title: 'API Authentication Guide', views: '15.2k', href: '#' },
      { title: 'OAuth Integration Tutorial', views: '11.8k', href: '#' },
      { title: 'SDK Installation and Setup', views: '7.9k', href: '#' },
      { title: 'Rate Limits and Best Practices', views: '5.4k', href: '#' },
    ]
  },
  {
    title: 'Account Management',
    icon: HelpCircle,
    description: 'Managing your account and billing',
    articles: [
      { title: 'Upgrading to Pro Plan', views: '10.1k', href: '#' },
      { title: 'Billing and Payment Issues', views: '6.7k', href: '#' },
      { title: 'Changing Your Username', views: '4.3k', href: '#' },
      { title: 'Deleting Your Account', views: '3.8k', href: '#' },
    ]
  },
];

const faqs = [
  {
    question: 'How do I create a profile on What\'sYour.Info?',
    answer: 'Creating a profile is simple! Click "Get Started" on our homepage, fill out the registration form with your basic information, and verify your email address. Your profile will be available at username.whatsyour.info immediately.',
  },
  {
    question: 'What\'s the difference between Free and Pro plans?',
    answer: 'Free plans include basic profile features like bio, social links, and email signature generator. Pro plans ($6/month) add custom domains, spotlight CTA buttons, lead capture forms, advanced analytics, and remove our branding.',
  },
  {
    question: 'Can I use my own domain name?',
    answer: 'Yes! Pro users can connect their own custom domain (like yourname.com) to their What\'sYour.Info profile. We provide easy DNS setup instructions and handle all the technical details.',
  },
  {
    question: 'How do I integrate What\'sYour.Info with my application?',
    answer: 'We provide comprehensive APIs and SDKs for popular programming languages. Start by getting an API key from your developer dashboard, then follow our integration guides for authentication and profile data access.',
  },
  {
    question: 'Is my data secure on What\'sYour.Info?',
    answer: 'Absolutely! We use industry-standard encryption, secure password hashing, and follow best practices for data protection. Your private information is never shared without your consent.',
  },
  {
    question: 'Can I export my data?',
    answer: 'Yes, you can export all your profile data at any time from your dashboard. We provide data in standard formats (JSON, CSV) for easy portability.',
  },
  {
    question: 'How do I cancel my Pro subscription?',
    answer: 'You can cancel your Pro subscription anytime from your billing settings. You\'ll continue to have Pro features until the end of your current billing period.',
  },
  {
    question: 'What happens if I delete my account?',
    answer: 'When you delete your account, all your profile data is permanently removed from our servers within 30 days. Your username becomes available for others to use after 90 days.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Help Center
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions, learn how to use What'sYour.Info, 
              and get the most out of your digital identity platform.
            </p>
            
            {/* Search Bar */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Help Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Card key={index} className="border-gray-200 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <category.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.articles.map((article, articleIndex) => (
                      <div key={articleIndex} className="flex items-center justify-between">
                        <Link 
                          href={article.href}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex-1"
                        >
                          {article.title}
                        </Link>
                        <span className="text-xs text-gray-500 ml-2">{article.views}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Articles
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <Card key={index} className="border-gray-200">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                      {expandedFaq === index ? (
                        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-6 pb-6">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredFaqs.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try searching with different keywords or browse our categories above.
                </p>
                <Button onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Contact Support */}
        <section>
          <Card className="border-gray-200 bg-blue-50">
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Still need help?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to help. 
                Get in touch and we'll get back to you as soon as possible.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Link href="/contact">
                  <Button size="lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" size="lg">
                    <Book className="h-4 w-4 mr-2" />
                    View Documentation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
    </div>
  );
}