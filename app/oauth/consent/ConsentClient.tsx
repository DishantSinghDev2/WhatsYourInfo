// app/oauth/consent/page.tsx

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Check, ShieldQuestion, Loader2, ExternalLink, Users, Calendar, BadgeCheck, ShieldX } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';

// --- INTERFACES ---
interface OAuthClient {
    _id: string;
    name: string;
    appLogo?: string;
    homepageUrl?: string;
    description?: string;
    createdAt: string; // ISO Date string
    users: number;
    opByWYI: boolean;
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'profile:read': 'View your basic profile information (name, bio, avatar).',
  'email:read': 'View your email address.',
  'profile:write': 'Update your profile information on your behalf.',
  'links:read': 'View your links.',
  'links:write': 'Add or update your links.',
};


// --- COMPONENT ---
export default function ConsentPage() {
  const searchParams = useSearchParams();
  const [client, setClient] = useState<OAuthClient | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [isProcessingConsent, setIsProcessingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = searchParams.get('client_id');
    const scopeParam = searchParams.get('scope') || '';
    const redirectUriParam = searchParams.get('redirect_uri');

    setScopes(scopeParam.split(' ').filter(s => s));
    setRedirectUri(redirectUriParam);

    if (!clientId) {
      setError('Invalid request: Client ID is missing.');
      setIsClientLoading(false);
      return;
    }
    if (!redirectUriParam) {
        setError('Invalid request: Redirect URI is missing.');
        setIsClientLoading(false);
        return;
    }


    const fetchClientDetails = async () => {
      try {
        const response = await fetch(`/api/v1/oauth-client/${clientId}`);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Application not found.');
        }
        const data: OAuthClient = await response.json();
        setClient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load application details.');
      } finally {
        setIsClientLoading(false);
      }
    };
    
    fetchClientDetails();
  }, [searchParams]);

  const handleConsent = async (allow: boolean) => {
    setIsProcessingConsent(true);
    try {
        const response = await fetch('/api/oauth/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: searchParams.get('client_id'),
                redirect_uri: redirectUri,
                scope: searchParams.get('scope'),
                state: searchParams.get('state'),
                allow,
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'An unknown error occurred.');
        
        // Redirect user's browser back to the third-party application
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
      return <p className="text-center text-red-600 font-medium p-8">{error}</p>;
    }
    if (client) {
      const isVerified = client.opByWYI;
      const appName = isVerified ? "WhatsYour.Info (Verified)" : client.name;
      const appLogo = isVerified ? "/logo.png" : client.appLogo || '/default-logo.png';


      return (
        <>
          <CardHeader className="text-center pb-4">
             <p className="text-sm text-gray-500 mb-4">
                <span className="font-semibold">{client.name}</span> wants to access your account
            </p>
            {/* --- NEW: Logo connection animation --- */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-center items-center my-4 space-x-2">
                <img src={appLogo} alt="App Logo" className="w-16 h-16 rounded-full border-2 p-1 bg-white" />
                <div className="flex-shrink-0 w-16 h-px bg-gray-300 relative">
                    <Check className="w-6 h-6 p-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-green-500 rounded-full border-2 border-green-500" />
                </div>
                <img src="/logo.png" alt="WhatsYour.Info Logo" className="w-16 h-16 rounded-full border-2 p-1" />
            </motion.div>

            <CardTitle className="text-2xl">Authorize {client.name}</CardTitle>

            {isVerified && (
                <div className="flex items-center justify-center text-sm text-green-600 bg-green-50 rounded-md p-2 mt-2">
                    <BadgeCheck className="h-4 w-4 mr-2"/> Official WhatsYour.Info Application
                </div>
            )}
            
            <p className="text-xs text-gray-500 mt-4">
                You will be redirected to: <br/> <code className="bg-gray-100 p-1 rounded text-gray-700">{redirectUri}</code>
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-800 mb-3 text-center">This application will be able to:</p>
              <ul className="space-y-2">
                {scopes.map(scope => (
                  <li key={scope} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-600 mr-2.5 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{SCOPE_DESCRIPTIONS[scope] || 'Perform an unknown action.'}</span>
                  </li>
                ))}
                {scopes.length === 0 && <li className="text-sm text-gray-500 text-center">Requesting basic access.</li>}
              </ul>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="w-full" onClick={() => handleConsent(false)} disabled={isProcessingConsent}>Deny</Button>
              <Button className="w-full" onClick={() => handleConsent(true)} disabled={isProcessingConsent}>
                {isProcessingConsent ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Allow Access'}
              </Button>
            </div>
          </CardContent>
          
          {/* --- NEW: Information Block --- */}
          <CardFooter className="flex-col items-start bg-gray-50/70 border-t pt-4 pb-4 text-xs text-gray-600">
             <div className="w-full space-y-2">
                {isVerified ? (
                     <div className="flex items-center"><BadgeCheck className="h-4 w-4 mr-2 text-green-600" /> Owned & operated by WhatsYour.Info</div>
                ) : (
                    <div className="flex items-center"><ShieldX className="h-4 w-4 mr-2 text-gray-500" /> Third-party application not operated by WhatsYour.Info</div>
                )}
               <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-gray-500" /> App created: {new Date(client.createdAt).toLocaleDateString()}</div>
               <div className="flex items-center"><Users className="h-4 w-4 mr-2 text-gray-500" /> Used by {client.users.toLocaleString()} {client.users === 1 ? 'user' : 'users'}</div>
             </div>
             {client.homepageUrl && <Link href={client.homepageUrl} target="_blank" className="text-blue-600 hover:underline mt-3 inline-flex items-center">Visit Website <ExternalLink className="h-3 w-3 ml-1" /></Link>}
          </CardFooter>
        </>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">{pageContent()}</Card>
    </div>
  );
}