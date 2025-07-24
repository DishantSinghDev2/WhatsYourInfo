import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Database,
  Key,
  Shield,
  Code,
} from 'lucide-react';
import Link from 'next/link';

const endpoints = [
  {
    category: 'Public API',
    description: 'Access public profile data without authentication',
    endpoints: [
      {
        method: 'GET',
        path: '/api/public/profile/{username}',
        description: 'Get public profile information',
        auth: 'None',
        response: {
          username: 'johndoe',
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Software engineer and entrepreneur',
          avatar: 'https://whatsyour.info/api/avatars/johndoe',
          isProUser: true,
          socialLinks: {
            twitter: 'https://twitter.com/johndoe',
            linkedin: 'https://linkedin.com/in/johndoe'
          },
          profileUrl: 'https://whatsyour.info/johndoe'
        }
      },
      {
        method: 'GET',
        path: '/api/public/search',
        description: 'Search public profiles',
        auth: 'None',
        params: [
          { name: 'q', type: 'string', required: true, description: 'Search query' },
          { name: 'limit', type: 'integer', required: false, description: 'Maximum results (default: 10)' }
        ],
        response: {
          profiles: [
            {
              username: 'johndoe',
              firstName: 'John',
              lastName: 'Doe',
              bio: 'Software engineer',
              avatar: 'https://whatsyour.info/api/avatars/johndoe'
            }
          ]
        }
      },
      {
        method: 'GET',
        path: '/api/avatars/{username}',
        description: 'Get user avatar image',
        auth: 'None',
        params: [
          { name: 'size', type: 'integer', required: false, description: 'Image size in pixels (default: 200)' }
        ],
        response: 'Binary image data (JPEG/PNG)'
      }
    ]
  },
  {
    category: 'Authentication API',
    description: 'User authentication and profile management (requires API key)',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Authenticate user with email and password',
        auth: 'API Key',
        body: {
          email: 'user@example.com',
          password: 'password123'
        },
        response: {
          message: 'Login successful',
          user: {
            _id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
            username: 'johndoe',
            firstName: 'John',
            lastName: 'Doe',
            isProUser: false
          },
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      },
      {
        method: 'GET',
        path: '/api/auth/user',
        description: 'Get authenticated user profile',
        auth: 'Bearer Token',
        response: {
          user: {
            _id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
            username: 'johndoe',
            firstName: 'John',
            lastName: 'Doe',
            bio: 'Software engineer',
            isProUser: false,
            socialLinks: {}
          }
        }
      },
      {
        method: 'PUT',
        path: '/api/auth/profile',
        description: 'Update user profile',
        auth: 'Bearer Token',
        body: {
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Updated bio',
          socialLinks: {
            twitter: 'https://twitter.com/johndoe'
          }
        },
        response: {
          message: 'Profile updated successfully',
          user: {
            _id: '507f1f77bcf86cd799439011',
            firstName: 'John',
            lastName: 'Doe',
            bio: 'Updated bio'
          }
        }
      }
    ]
  },
  {
    category: 'OAuth API',
    description: 'OAuth 2.0 authentication flow for third-party applications',
    endpoints: [
      {
        method: 'GET',
        path: '/oauth/authorize',
        description: 'OAuth authorization endpoint',
        auth: 'None',
        params: [
          { name: 'client_id', type: 'string', required: true, description: 'OAuth client ID' },
          { name: 'redirect_uri', type: 'string', required: true, description: 'Callback URL' },
          { name: 'response_type', type: 'string', required: true, description: 'Must be "code"' },
          { name: 'scope', type: 'string', required: false, description: 'Requested scopes' },
          { name: 'state', type: 'string', required: false, description: 'CSRF protection' }
        ],
        response: 'Redirects to redirect_uri with authorization code'
      },
      {
        method: 'POST',
        path: '/api/oauth/token',
        description: 'Exchange authorization code for access token',
        auth: 'None',
        body: {
          client_id: 'your_client_id',
          client_secret: 'your_client_secret',
          code: 'authorization_code',
          redirect_uri: 'https://yourapp.com/callback',
          grant_type: 'authorization_code'
        },
        response: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            _id: '507f1f77bcf86cd799439011',
            username: 'johndoe',
            email: 'user@example.com'
          }
        }
      }
    ]
  },
  {
    category: 'Developer API',
    description: 'Manage API keys and OAuth applications (requires authentication)',
    endpoints: [
      {
        method: 'GET',
        path: '/api/dev/keys',
        description: 'List API keys',
        auth: 'Bearer Token',
        response: {
          keys: [
            {
              _id: '507f1f77bcf86cd799439011',
              name: 'Production API Key',
              key: 'wyi_live_1234567890abcdef...',
              isActive: true,
              createdAt: '2025-01-15T10:30:00Z',
              lastUsed: '2025-01-15T15:45:00Z'
            }
          ]
        }
      },
      {
        method: 'POST',
        path: '/api/dev/keys',
        description: 'Create new API key',
        auth: 'Bearer Token',
        body: {
          name: 'My App API Key'
        },
        response: {
          message: 'API key created successfully',
          key: {
            _id: '507f1f77bcf86cd799439011',
            name: 'My App API Key',
            key: 'wyi_live_1234567890abcdef...',
            isActive: true,
            createdAt: '2025-01-15T10:30:00Z'
          }
        }
      }
    ]
  }
];

const authMethods = [
  {
    name: 'API Key',
    description: 'Include your API key in the Authorization header',
    example: 'Authorization: Bearer wyi_live_1234567890abcdef...',
    usage: 'Required for authentication endpoints and private operations'
  },
  {
    name: 'Bearer Token',
    description: 'Use JWT tokens for authenticated user operations',
    example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    usage: 'Required for user-specific operations and profile management'
  },
  {
    name: 'OAuth 2.0',
    description: 'Standard OAuth 2.0 flow for third-party applications',
    example: 'Authorization: Bearer oauth_access_token',
    usage: 'For applications that need to act on behalf of users'
  }
];

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              API Reference
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Complete REST API documentation for What'sYour.Info. 
              Build powerful integrations with our comprehensive API.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Link href="/dev">
                <Button size="lg">
                  <Key className="h-4 w-4 mr-2" />
                  Get API Key
                </Button>
              </Link>
              <Link href="/docs/sdks">
                <Button variant="outline" size="lg">
                  <Code className="h-4 w-4 mr-2" />
                  View SDKs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Base URL */}
      <section className="py-8 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Base URL</h3>
                  <p className="text-gray-600">All API requests should be made to:</p>
                </div>
                <Badge variant="secondary">REST API</Badge>
              </div>
              <code className="block bg-gray-900 text-green-400 p-4 rounded-lg mt-4 text-lg font-mono">
                https://whatsyour.info/api
              </code>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Authentication */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Authentication
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Different endpoints require different authentication methods
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {authMethods.map((method, index) => (
              <Card key={index} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    {method.name}
                  </CardTitle>
                  <CardDescription>
                    {method.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Example</h4>
                      <code className="block bg-gray-100 p-3 rounded text-sm text-gray-800 break-all">
                        {method.example}
                      </code>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Usage</h4>
                      <p className="text-sm text-gray-600">{method.usage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              API Endpoints
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Complete reference for all available endpoints
            </p>
          </div>
          
          <div className="space-y-12">
            {endpoints.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {category.category}
                  </h3>
                  <p className="text-gray-600">{category.description}</p>
                </div>
                
                <div className="space-y-6">
                  {category.endpoints.map((endpoint, endpointIndex) => (
                    <Card key={endpointIndex} className="border-gray-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge 
                              variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                              className={
                                endpoint.method === 'GET' 
                                  ? 'bg-green-100 text-green-800'
                                  : endpoint.method === 'POST'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="text-lg font-mono text-gray-900">
                              {endpoint.path}
                            </code>
                          </div>
                          <Badge 
                            variant={endpoint.auth === 'None' ? 'secondary' : 'default'}
                            className={
                              endpoint.auth === 'None'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {endpoint.auth}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">
                          {endpoint.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Parameters */}
                          {endpoint.params && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Parameters</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-2 font-medium text-gray-900">Name</th>
                                      <th className="text-left py-2 font-medium text-gray-900">Type</th>
                                      <th className="text-left py-2 font-medium text-gray-900">Required</th>
                                      <th className="text-left py-2 font-medium text-gray-900">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {endpoint.params.map((param, paramIndex) => (
                                      <tr key={paramIndex} className="border-b border-gray-100">
                                        <td className="py-2 font-mono text-blue-600">{param.name}</td>
                                        <td className="py-2 text-gray-600">{param.type}</td>
                                        <td className="py-2">
                                          <Badge variant={param.required ? 'default' : 'secondary'}>
                                            {param.required ? 'Required' : 'Optional'}
                                          </Badge>
                                        </td>
                                        <td className="py-2 text-gray-600">{param.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Request Body */}
                          {endpoint.body && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Request Body</h4>
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{JSON.stringify(endpoint.body, null, 2)}</code>
                              </pre>
                            </div>
                          )}

                          {/* Response */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Response</h4>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                              <code>
                                {typeof endpoint.response === 'string' 
                                  ? endpoint.response 
                                  : JSON.stringify(endpoint.response, null, 2)
                                }
                              </code>
                            </pre>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Rate Limits
              </CardTitle>
              <CardDescription>
                API usage limits to ensure fair usage and system stability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Free Tier</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• 1,000 requests per hour</li>
                    <li>• 10,000 requests per day</li>
                    <li>• Public API access only</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Pro Tier</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• 10,000 requests per hour</li>
                    <li>• 100,000 requests per day</li>
                    <li>• Full API access</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Rate limit headers:</strong> All responses include rate limit information in headers:
                  <code className="ml-2">X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Error Codes */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Error Codes</CardTitle>
              <CardDescription>
                Standard HTTP status codes and error responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { code: '200', name: 'OK', description: 'Request successful' },
                  { code: '400', name: 'Bad Request', description: 'Invalid request parameters' },
                  { code: '401', name: 'Unauthorized', description: 'Authentication required or invalid' },
                  { code: '403', name: 'Forbidden', description: 'Access denied' },
                  { code: '404', name: 'Not Found', description: 'Resource not found' },
                  { code: '429', name: 'Too Many Requests', description: 'Rate limit exceeded' },
                  { code: '500', name: 'Internal Server Error', description: 'Server error' }
                ].map((error, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={error.code.startsWith('2') ? 'secondary' : 'default'}
                        className={
                          error.code.startsWith('2') 
                            ? 'bg-green-100 text-green-800'
                            : error.code.startsWith('4')
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {error.code}
                      </Badge>
                      <span className="font-medium text-gray-900">{error.name}</span>
                    </div>
                    <span className="text-gray-600">{error.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}