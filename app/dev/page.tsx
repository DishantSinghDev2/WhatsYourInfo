'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import {
  Code,
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  Globe,
  Shield,
  Database,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { User } from '@/lib/auth';

interface ApiKey {
  _id: string;
  name: string;
  key: string;
  lastUsed?: string;
  createdAt: string;
  isActive: boolean;
}

interface OAuthClient {
  _id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  description: string;
  createdAt: string;
  isActive: boolean;
}

export default function DeveloperDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [oauthClients, setOAuthClients] = useState<OAuthClient[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    description: '',
    redirectUris: [''],
  });

  useEffect(() => {
    fetchUserProfile();
    fetchApiKeys();
    fetchOAuthClients();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/dev/keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const fetchOAuthClients = async () => {
    try {
      const response = await fetch('/api/dev/oauth-clients');
      if (response.ok) {
        const data = await response.json();
        setOAuthClients(data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch OAuth clients:', error);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    setIsCreatingKey(true);
    try {
      const response = await fetch('/api/dev/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(prev => [...prev, data.key]);
        setNewKeyName('');
        toast.success('API key created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create API key');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsCreatingKey(false);
    }
  };

  const createOAuthClient = async () => {
    if (!newClient.name.trim() || !newClient.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreatingClient(true);
    try {
      const response = await fetch('/api/dev/oauth-clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      if (response.ok) {
        const data = await response.json();
        setOAuthClients(prev => [...prev, data.client]);
        setNewClient({
          name: '',
          description: '',
          redirectUris: [''],
        });
        toast.success('OAuth client created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create OAuth client');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/dev/keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key._id !== keyId));
        toast.success('API key deleted successfully');
      } else {
        toast.error('Failed to delete API key');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-6">
              <p className="text-gray-600 mb-4">Please sign in to access the developer dashboard.</p>
              <Button onClick={() => router.push('/login')}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Developer Dashboard</h1>
              <p className="text-gray-600">Manage your API keys and OAuth applications</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/docs')}>
                <Code className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <Settings className="h-4 w-4 mr-2" />
                Profile Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Key className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">API Keys</p>
                  <p className="text-2xl font-bold text-gray-900">{apiKeys.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">OAuth Apps</p>
                  <p className="text-2xl font-bold text-gray-900">{oauthClients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">API Calls</p>
                  <p className="text-2xl font-bold text-gray-900">Coming Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rate Limit</p>
                  <p className="text-2xl font-bold text-gray-900">1000/hr</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Keys */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Key className="h-5 w-5 mr-2" />
                      API Keys
                    </CardTitle>
                    <CardDescription>
                      Manage your API keys for accessing What'sYour.Info APIs
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Create New API Key */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-3">Create New API Key</h4>
                    <div className="flex space-x-3">
                      <Input
                        placeholder="API Key Name (e.g., My App Production)"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={createApiKey} disabled={isCreatingKey}>
                        <Plus className="h-4 w-4 mr-2" />
                        {isCreatingKey ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </div>

                  {/* Existing API Keys */}
                  <div className="space-y-3">
                    {apiKeys.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No API keys created yet. Create your first API key to get started.
                      </p>
                    ) : (
                      apiKeys.map((key) => (
                        <div key={key._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{key.name}</h5>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleSecretVisibility(key._id)}
                              >
                                {showSecrets[key._id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(key.key)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteApiKey(key._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <code className="block bg-gray-100 p-2 rounded text-sm font-mono break-all">
                            {showSecrets[key._id] ? key.key : key.key.replace(/./g, '•')}
                          </code>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                            <span>Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OAuth Applications */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      OAuth Applications
                    </CardTitle>
                    <CardDescription>
                      Create OAuth apps for "Sign in with What'sYour.Info"
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Create New OAuth Client */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-3">Create New OAuth App</h4>
                    <div className="space-y-3">
                      <Input
                        placeholder="Application Name"
                        value={newClient.name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Application Description"
                        value={newClient.description}
                        onChange={(e) => setNewClient(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <Input
                        placeholder="Redirect URI (https://yourapp.com/callback)"
                        value={newClient.redirectUris[0]}
                        onChange={(e) => setNewClient(prev => ({ 
                          ...prev, 
                          redirectUris: [e.target.value] 
                        }))}
                      />
                      <Button onClick={createOAuthClient} disabled={isCreatingClient} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        {isCreatingClient ? 'Creating...' : 'Create OAuth App'}
                      </Button>
                    </div>
                  </div>

                  {/* Existing OAuth Clients */}
                  <div className="space-y-3">
                    {oauthClients.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No OAuth applications created yet. Create your first OAuth app to enable SSO.
                      </p>
                    ) : (
                      oauthClients.map((client) => (
                        <div key={client._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{client.name}</h5>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleSecretVisibility(client._id)}
                              >
                                {showSecrets[client._id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{client.description}</p>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-medium text-gray-500">Client ID</label>
                              <code className="block bg-gray-100 p-2 rounded text-sm font-mono break-all">
                                {client.clientId}
                              </code>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Client Secret</label>
                              <code className="block bg-gray-100 p-2 rounded text-sm font-mono break-all">
                                {showSecrets[client._id] ? client.clientSecret : client.clientSecret.replace(/./g, '•')}
                              </code>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Redirect URIs</label>
                              {client.redirectUris.map((uri, index) => (
                                <code key={index} className="block bg-gray-100 p-2 rounded text-sm font-mono break-all mt-1">
                                  {uri}
                                </code>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500">
                            Created: {new Date(client.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documentation Links */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start" onClick={() => router.push('/docs')}>
                <Code className="h-4 w-4 mr-2" />
                API Documentation
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => router.push('/docs#quickstart')}>
                <Zap className="h-4 w-4 mr-2" />
                Quick Start Guide
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => router.push('/docs#sdks')}>
                <Database className="h-4 w-4 mr-2" />
                SDKs & Libraries
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}