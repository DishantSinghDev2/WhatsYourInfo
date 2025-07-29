// components/settings/ConnectedAppsPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Loader2, ShieldQuestion, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Connection {
  clientId: string;
  name: string;
  appLogo?: string;
  createdAt: string;
}

export function ConnectedAppsPanel() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/settings/connections');
        if (!response.ok) throw new Error('Failed to fetch connections');
        const data = await response.json();
        setConnections(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not load connected apps.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConnections();
  }, []);

  const handleRevoke = async (clientId: string) => {
    if (!confirm('Are you sure? This will disconnect the application and it will no longer have access to your data.')) return;
    
    try {
        const res = await fetch('/api/settings/connections', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        toast.success('Application access revoked.');
        setConnections(prev => prev.filter(c => c.clientId !== clientId));
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not revoke access.');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Applications</CardTitle>
        <CardDescription>These are third-party applications you have granted access to your WhatsYour.Info account.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400"/></div>
        ) : connections.length > 0 ? (
          <div className="space-y-4">
            {connections.map(app => (
              <div key={app.clientId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                 <div className="flex items-center gap-4">
                      {app.appLogo ? <img src={app.appLogo} alt="logo" className="w-10 h-10 rounded-full border"/> : <ShieldQuestion className="w-10 h-10 text-gray-400"/>}
                      <div>
                          <p className="font-semibold text-gray-900">{app.name}</p>
                          <p className="text-xs text-gray-500">Authorized: {new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                 </div>
                 <Button variant="destructive" size="sm" onClick={() => handleRevoke(app.clientId)}>
                     <Trash2 className="h-4 w-4 mr-2"/>Revoke
                 </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 py-8">You haven't connected any third-party applications yet.</p>
        )}
      </CardContent>
    </Card>
  );
}