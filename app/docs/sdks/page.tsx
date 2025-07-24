import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Code,
  BookOpen,
  Github,
} from 'lucide-react';
import Link from 'next/link';

const sdks = [
  {
    name: 'JavaScript/Node.js',
    description: 'Official JavaScript SDK with full TypeScript support for browser and Node.js environments.',
    language: 'javascript',
    install: 'npm install @whatsyour/info-js',
    github: 'https://github.com/whatsyour-info/sdk-javascript',
    docs: '/docs/sdks/javascript',
    version: '1.0.0',
    features: [
      'TypeScript definitions included',
      'Works in browser and Node.js',
      'Promise-based API',
      'Automatic error handling',
      'OAuth 2.0 support',
    ],
    example: `import WhatsYourInfoSDK from '@whatsyour/info-js';

const sdk = new WhatsYourInfoSDK({
  apiKey: 'your-api-key'
});

// Get public profile
const profile = await sdk.getProfile('username');
console.log(profile);

// Authenticate user
const auth = await sdk.authenticateUser('user@example.com', 'password');
console.log(auth.user);`,
  },
  {
    name: 'Python',
    description: 'Python SDK compatible with Django, Flask, FastAPI and other Python frameworks.',
    language: 'python',
    install: 'pip install whatsyour-info',
    github: 'https://github.com/whatsyour-info/sdk-python',
    docs: '/docs/sdks/python',
    version: '1.0.0',
    features: [
      'Python 3.7+ support',
      'Type hints included',
      'Async/await support',
      'Django/Flask integration',
      'Comprehensive error handling',
    ],
    example: `from whatsyour_info import WhatsYourInfoSDK

sdk = WhatsYourInfoSDK(api_key='your-api-key')

# Get public profile
profile = sdk.get_profile('username')
print(profile.firstName, profile.lastName)

# Authenticate user
auth = sdk.authenticate_user('user@example.com', 'password')
print(auth.user.username)`,
  },
  {
    name: 'Go',
    description: 'High-performance Go SDK for building scalable applications with What\'sYour.Info.',
    language: 'go',
    install: 'go get github.com/whatsyour/info-go',
    github: 'https://github.com/whatsyour-info/sdk-go',
    docs: '/docs/sdks/go',
    version: '1.0.0',
    features: [
      'Go 1.19+ support',
      'Context support',
      'Structured error handling',
      'HTTP client customization',
      'Concurrent-safe',
    ],
    example: `package main

import (
    "fmt"
    whatsyourinfo "github.com/whatsyour/info-go"
)

func main() {
    client := whatsyourinfo.NewClient(whatsyourinfo.Config{
        APIKey: "your-api-key",
    })

    // Get public profile
    profile, err := client.GetProfile("username")
    if err != nil {
        panic(err)
    }
    fmt.Printf("%s %s\\n", profile.FirstName, profile.LastName)
}`,
  },
  {
    name: 'PHP',
    description: 'PHP SDK for Laravel, Symfony, WordPress and vanilla PHP applications.',
    language: 'php',
    install: 'composer require whatsyour/info-php',
    github: 'https://github.com/whatsyour-info/sdk-php',
    docs: '/docs/sdks/php',
    version: '1.0.0',
    features: [
      'PHP 7.4+ support',
      'PSR-4 autoloading',
      'Laravel service provider',
      'Guzzle HTTP client',
      'Exception handling',
    ],
    example: `<?php
require_once 'vendor/autoload.php';

use WhatsYourInfo\\Client;

$client = new Client([
    'api_key' => 'your-api-key'
]);

// Get public profile
$profile = $client->getProfile('username');
echo $profile['firstName'] . ' ' . $profile['lastName'];

// Authenticate user
$auth = $client->authenticateUser('user@example.com', 'password');
echo $auth['user']['username'];`,
  },
];

export default function SDKsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Official SDKs
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              First-class libraries for your favorite programming languages. 
              Get started quickly with our official SDKs and comprehensive documentation.
            </p>
          </div>
        </div>
      </section>

      {/* SDKs Grid */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {sdks.map((sdk) => (
              <Card key={sdk.language} className="border-gray-200 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{sdk.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {sdk.description}
                      </CardDescription>
                    </div>
                    <div className="text-sm text-gray-500">
                      v{sdk.version}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Installation */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Installation</h4>
                    <code className="block bg-gray-100 p-3 rounded-lg text-sm text-gray-800 overflow-x-auto">
                      {sdk.install}
                    </code>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                    <ul className="space-y-1">
                      {sdk.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Example Code */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Quick Example</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                      <code>{sdk.example}</code>
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    <Link href={sdk.docs}>
                      <Button size="sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Documentation
                      </Button>
                    </Link>
                    <Link href={sdk.github} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Getting Started
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Follow these steps to start using our SDKs
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-semibold">
                  1
                </div>
                <CardTitle className="text-lg">Get API Key</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Sign up for a free account and get your API key from the developer dashboard.
                </p>
                <Link href="/dev">
                  <Button variant="outline" size="sm">
                    Get API Key
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 font-semibold">
                  2
                </div>
                <CardTitle className="text-lg">Install SDK</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Choose your preferred language and install the SDK using your package manager.
                </p>
                <Link href="#sdks">
                  <Button variant="outline" size="sm">
                    View SDKs
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 font-semibold">
                  3
                </div>
                <CardTitle className="text-lg">Start Building</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Follow our documentation and examples to integrate What'sYour.Info into your app.
                </p>
                <Link href="/docs">
                  <Button variant="outline" size="sm">
                    Read Docs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community SDKs */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
            Community SDKs
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Don't see your language? The community has created SDKs for additional languages.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {['Ruby', 'Rust', 'Java', 'C#', 'Swift', 'Kotlin', 'Dart', 'Elixir'].map((lang) => (
              <div key={lang} className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{lang}</div>
                <div className="text-xs text-gray-500 mt-1">Community</div>
              </div>
            ))}
          </div>
          
          <p className="text-gray-600 mb-6">
            Want to contribute an SDK for your favorite language?
          </p>
          <Link href="/contact">
            <Button>
              <Code className="h-4 w-4 mr-2" />
              Contribute SDK
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}