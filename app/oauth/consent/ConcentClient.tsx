// app/oauth/consent/page.tsx

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Check, ShieldQuestion, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface OAuthClient { name: string; appLogo?: string; homepageUrl?: string; description?: string; }
const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'profile:read': 'View your basic profile information (name, bio, avatar).',
  'email:read': 'View your email address.',
  'profile:write': 'Update your profile information on your behalf.',
  'links:read': 'View your links.',
  'links:write': 'Add or update your links.',
};

export default function ConsentPage() {
  const searchParams = useSearchParams();
  const [client, setClient] = useState<OAuthClient | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [isProcessingConsent, setIsProcessingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientDetails = async () => {
      const clientId = searchParams.get('client_id');
      if (!clientId) {
        setError('Invalid request: Client ID is missing.');
        setIsClientLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/oauth-client/${clientId}`);
        if (!response.ok) throw new Error('Application not found.');
        const data = await response.json();
        setClient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load application details.');
      } finally {
        setIsClientLoading(false);
      }
    };
    
    fetchClientDetails();
    const scopeParam = searchParams.get('scope') || '';
    setScopes(scopeParam.split(' ').filter(s => s));
  }, [searchParams]);

  const handleConsent = async (allow: boolean) => {
    setIsProcessingConsent(true);
    try {
        const response = await fetch('/api/oauth/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: searchParams.get('client_id'),
                redirect_uri: searchParams.get('redirect_uri'),
                scope: searchParams.get('scope'),
                state: searchParams.get('state'),
                allow,
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'An unknown error occurred.');
        
        // This will redirect the user's browser back to the third-party application
        window.location.href = data.redirect;
    } catch (err) {
        toast.error(err instanceof Error ? err.message : "An error occurred during authorization.");
        setIsProcessingConsent(false);
    }
  };

  const pageContent = () => {
    if (isClientLoading) {
      return <Loader2 className="h-12 w-12 mx-auto animate-spin text-gray-400" />;
    }
    if (error) {
      return <p className="text-center text-red-600">{error}</p>;
    }
    if (client) {
      return (
        <>
          <CardHeader className="text-center">
            {client.appLogo ? <img src={client.appLogo} alt={`${client.name} Logo`} className="w-16 h-16 mx-auto rounded-full mb-4 border" /> : <ShieldQuestion className="w-16 h-16 mx-auto text-gray-400 mb-4" />}
            <CardTitle>Authorize <span className="text-blue-600">{client.name}</span></CardTitle>
            <p className="text-sm text-gray-600">This third-party application wants to access your WhatsYour.Info account.</p>
            {client.homepageUrl && <Link href={client.homepageUrl} target="_blank" className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center">Visit Website <ExternalLink className="h-3 w-3 ml-1" /></Link>}
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-800 mb-2">This application will be able to:</p>
              <ul className="space-y-2">
                {scopes.map(scope => (
                  <li key={scope} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{SCOPE_DESCRIPTIONS[scope] || 'Perform an unknown action.'}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="w-full" onClick={() => handleConsent(false)} disabled={isProcessingConsent}>Deny</Button>
              <Button className="w-full" onClick={() => handleConsent(true)} disabled={isProcessingConsent}>
                {isProcessingConsent ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Allow Access'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">By allowing access, you agree to share your data with <span className="font-semibold">{client.name}</span>.</p>
          </CardContent>
        </>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">{pageContent()}</Card>
    </div>
  );
}