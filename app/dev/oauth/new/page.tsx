'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import { ArrowLeft, Plus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// Define the available scopes for your API
const AVAILABLE_SCOPES = [
  { id: 'profile:read', description: 'Read basic profile information (name, bio, avatar).' },
  { id: 'email:read', description: 'Read the user\'s email address.' },
  { id: 'profile:write', description: 'Update the user\'s profile information.' },
  { id: 'links:read', description: 'Read user\'s links.' },
  { id: 'links:write', description: 'Add or update user\'s links.' },
];

export default function CreateOAuthClientPage() {
  const router = useRouter();
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    description: '',
    homepageUrl: '',
    appLogo: '',
    redirectUris: [''],
    grantedScopes: [] as string[],
  });

  const handleScopeChange = (scopeId: string, checked: boolean) => {
    setNewClient(prev => {
      const scopes = new Set(prev.grantedScopes);
      if (checked) {
        scopes.add(scopeId);
      } else {
        scopes.delete(scopeId);
      }
      return { ...prev, grantedScopes: Array.from(scopes) };
    });
  };

  const createOAuthClient = async () => {
    // Simple validation
    if (!newClient.name.trim() || !newClient.redirectUris[0].trim()) {
      toast.error('Application Name and at least one Redirect URI are required.');
      return;
    }

    setIsCreatingClient(true);
    try {
      const response = await fetch('/api/dev/oauth-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...newClient,
            // Filter out empty strings before sending
            redirectUris: newClient.redirectUris.filter(uri => uri.trim() !== '')
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OAuth app created successfully!');
        // --- KEY CHANGE: Redirect to the new client's detail page ---
        router.push(`/dev/oauth/${data.client._id}`);
      } else {
        // Handle Zod errors or other server errors
        const errorMessage = data.details ? data.details[0].message : (data.error || 'Failed to create OAuth client');
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('A network error occurred. Please try again.');
    } finally {
      setIsCreatingClient(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="outline" onClick={() => router.push('/dev')} className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                        <Shield className="h-6 w-6 mr-3 text-blue-600" />
                        Create a New OAuth Application
                    </CardTitle>
                    <CardDescription>
                        Register a new application to use "Sign in with What'sYour.Info".
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Input placeholder="Application Name*" value={newClient.name} onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))} />
                        <Input placeholder="Description" value={newClient.description} onChange={(e) => setNewClient(prev => ({ ...prev, description: e.target.value }))} />
                        <Input placeholder="Application Homepage URL" value={newClient.homepageUrl} onChange={(e) => setNewClient(prev => ({ ...prev, homepageUrl: e.target.value }))} />
                        <Input placeholder="Application Logo URL" value={newClient.appLogo} onChange={(e) => setNewClient(prev => ({ ...prev, appLogo: e.target.value }))} />
                        <Input placeholder="Redirect URI (e.g., https://app.com/callback)*" value={newClient.redirectUris[0]} onChange={(e) => setNewClient(prev => ({ ...prev, redirectUris: [e.target.value] }))} />

                        <div>
                            <label className="text-sm font-medium text-gray-900 mb-2 block">Requested Permissions (Scopes)</label>
                            <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                            {AVAILABLE_SCOPES.map(scope => (
                                <div key={scope.id} className="flex items-start space-x-3">
                                <Checkbox
                                    id={scope.id}
                                    checked={newClient.grantedScopes.includes(scope.id)}
                                    onCheckedChange={(checked) => handleScopeChange(scope.id, !!checked)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor={scope.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{scope.id}</label>
                                    <p className="text-sm text-muted-foreground">{scope.description}</p>
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>

                        <Button onClick={createOAuthClient} disabled={isCreatingClient} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            {isCreatingClient ? 'Creating...' : 'Create OAuth App'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
      </div>
    </div>
  );
}