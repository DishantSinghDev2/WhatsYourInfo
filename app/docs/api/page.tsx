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
    category: 'Public Endpoints (v1)',
    description: 'Access public data without authentication.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/profile/{username}',
        description: 'Get public profile information for a specific user.',
        auth: 'None',
        response: { username: 'johndoe', firstName: 'John', bio: 'Software engineer...', isProUser: true, links: [], design: {} /* ... */ }
      },
      {
        method: 'GET',
        path: '/api/v1/avatars/{username}',
        description: 'Get a user\'s avatar image.',
        auth: 'None',
        response: 'Binary image data (e.g., image/png)'
      }
    ]
  },
  {
    category: 'Authentication API (v1)',
    description: 'Authenticate and get a short-lived token for further requests.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        description: 'Exchange a permanent API Key for a short-lived JWT.',
        auth: 'API Key',
        body: {},
        response: {
          message: 'Authentication successful',
          token_type: 'Bearer',
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expires_in: 3600
        }
      }
    ]
  },
  {
    category: 'Authenticated User API (v1)',
    description: 'Manage the user profile associated with your access token.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/me',
        description: 'Get the complete profile of the authenticated user.',
        auth: 'Bearer Token',
        response: { _id: '...', username: 'johndoe', email: 'user@example.com', bio: '...', links: [{ title: "Portfolio", url: "..." }] }
      },
      {
        method: 'PUT',
        path: '/api/v1/me',
        description: 'Update fields on the authenticated user\'s profile.',
        auth: 'Bearer Token',
        body: {
          firstName: 'John',
          bio: 'My updated bio.',
          links: [{ title: "My Website", url: "https://example.com" }],
          design: { theme: 'nite' }
        },
        response: { message: 'Profile updated successfully.' }
      }
    ]
  },
  {
    category: 'Developer Management API',
    description: 'Manage your own developer resources like API keys and OAuth apps.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/dev/stats',
        description: 'Get usage statistics for your developer account.',
        auth: 'Cookie (Web UI)',
        response: { apiKeys: 1, oauthClients: 0, apiCalls: 150, rateLimit: '1,000/hr' }
      },
      {
        method: 'GET',
        path: '/api/dev/keys',
        description: 'List all of your API keys.',
        auth: 'Cookie (Web UI)',
        response: { keys: [{ _id: '...', name: 'Production Key', key: 'wyi_...', lastUsed: '...' }] }
      },
      {
        method: 'POST',
        path: '/api/dev/keys',
        description: 'Create a new API key.',
        auth: 'Cookie (Web UI)',
        body: { name: 'My New App Key' },
        response: { message: 'API key created successfully', key: { /* ...new key object... */ } }
      },
      {
        method: 'DELETE',
        path: '/api/dev/keys/{keyId}',
        description: 'Permanently delete an API key.',
        auth: 'Cookie (Web UI)',
        response: { message: 'API key deleted successfully' }
      }
      // You would add OAuth client management endpoints here as well
    ]
  },
  // In app/docs/page.tsx, replace the 'OAuth API (v1)' object with this:

  {
    category: 'OAuth API (v1)',
    description: 'Standard OAuth 2.0 Authorization Code flow for third-party applications to securely access user data on their behalf.',
    endpoints: [
      {
        method: 'GET',
        path: '/oauth/authorize',
        description: 'The first step of the OAuth flow. Redirect the user to this endpoint to request their permission for your application to access their data.',
        auth: 'None (User Session)',
        params: [
          { name: 'client_id', type: 'string', required: true, description: 'The Client ID of your registered OAuth Application.' },
          { name: 'redirect_uri', type: 'string', required: true, description: 'The callback URL where the user will be sent after authorization. Must exactly match one of the URIs in your app settings.' },
          { name: 'response_type', type: 'string', required: true, description: 'Must be the literal string "code".' },
          { name: 'scope', type: 'string', required: true, description: 'A space-delimited list of permissions your app is requesting. Example: "profile:read email:read".' },
          { name: 'state', type: 'string', required: false, description: 'An opaque value used to prevent CSRF attacks. It will be returned to you in the redirect.' }
        ],
        response: 'Redirects the user to your `redirect_uri` with an authorization `code` and the original `state` in the query parameters upon success. On failure, it redirects with an `error` parameter.'
      },
      {
        method: 'POST',
        path: '/api/v1/oauth/token',
        description: 'The second step of the OAuth flow. Your server exchanges an authorization code or a refresh token for a new access token.',
        auth: 'None',
        body: {
          grant_type: '"authorization_code" or "refresh_token"',
          client_id: 'your_client_id',
          client_secret: 'your_client_secret',
          '//--- If': 'grant_type is "authorization_code" ---',
          code: 'the_authorization_code_from_the_redirect',
          redirect_uri: 'the_exact_same_redirect_uri_from_the_first_step',
          '//--- Or if': 'grant_type is "refresh_token" ---',
          refresh_token: 'the_refresh_token_from_a_previous_exchange'
        },
        response: {
          access_token: 'wyi_at_new_access_token...',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'wyi_rt_a_brand_new_refresh_token...',
          scope: 'profile:read email:read',
          '//--- IMPORTANT!': 'Refresh Token Rotation is enabled. Each time you use a refresh token, you will receive a NEW refresh token in the response. You MUST save this new one for future use, as the old one is immediately invalidated.'
        }
      }
    ]
  }
];

const authMethods = [
  {
    name: 'API Key',
    description: 'A permanent secret key for server-to-server authentication.',
    example: 'Authorization: Bearer wyi_live_1234567890abcdef...',
    usage: 'Use this key ONLY to authenticate with the /api/v1/auth/login endpoint to get a short-lived JWT.'
  },
  {
    name: 'Bearer Token (JWT)',
    description: 'A short-lived token used to access protected user resources.',
    example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    usage: 'Obtained from the login endpoint. Use this for all calls to /api/v1/me.'
  },
  {
    name: 'OAuth 2.0',
    description: 'Standard flow for applications acting on behalf of other users.',
    example: 'Authorization: Bearer oauth_access_token_...',
    usage: 'Use this when you need users to grant your app permission to access their data.'
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
      {/* Base URL (Updated) */}
      <section className="py-8 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Base URL</h3>
                  <p className="text-gray-600">All developer API requests should be made to:</p>
                </div>
                <Badge variant="secondary">REST API v1</Badge>
              </div>
              <code className="block bg-gray-900 text-green-400 p-4 rounded-lg mt-4 text-lg font-mono">
                https://whatsyour.info/api/v1
              </code>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Authentication (Updated) */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Authentication</h2>
            <p className="mt-4 text-lg text-gray-600">Our API uses a simple, secure token-based authentication system.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {authMethods.map((method, index) => (
              <Card key={index} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center"><Shield className="h-5 w-5 mr-2 text-blue-600" />{method.name}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Example Header</h4>
                      <code className="block bg-gray-100 p-3 rounded text-sm text-gray-800 break-all">{method.example}</code>
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

      {/* API Endpoints (Updated with new data) */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">API Endpoints</h2>
            <p className="mt-4 text-lg text-gray-600">Complete reference for all available endpoints.</p>
          </div>

          <div className="space-y-12">
            {endpoints.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="mb-8 border-l-4 border-blue-500 pl-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{category.category}</h3>
                  <p className="text-gray-600">{category.description}</p>
                </div>

                <div className="space-y-6">
                  {category.endpoints.map((endpoint, endpointIndex) => (
                    <Card key={endpointIndex} className="border-gray-200 overflow-hidden">
                      <CardHeader className="bg-gray-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge
                              className={
                                endpoint.method === 'GET' ? 'bg-green-100 text-green-800 border-green-200'
                                  : endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800 border-blue-200'
                                    : endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                      : 'bg-red-100 text-red-800 border-red-200'
                              }
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                          </div>
                          <Badge
                            className={
                              endpoint.auth === 'None' ? 'bg-gray-100 text-gray-800 border-gray-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }
                          >
                            Auth: {endpoint.auth}
                          </Badge>
                        </div>
                        <CardDescription className="text-base pt-2">{endpoint.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
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
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>{JSON.stringify(endpoint.body, null, 2)}</code></pre>
                            </div>
                          )}
                          {/* Response */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Example Response</h4>
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