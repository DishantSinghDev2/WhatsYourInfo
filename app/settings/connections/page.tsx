// app/settings/connections/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, ShieldQuestion, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

interface Connection {
    clientId: string;
    name: string;
    appLogo?: string;
    grantedScopes: string[];
    createdAt: string;
}

export default function ConnectionsPage() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchConnections();
    }, []);

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

    const handleRevoke = async (clientId: string) => {
        if (!confirm('Are you sure you want to revoke access for this application?')) return;
        try {
            const response = await fetch('/api/settings/connections', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId })
            });
            if (!response.ok) throw new Error('Failed to revoke access');
            toast.success('Application access revoked.');
            // Refresh the list
            setConnections(prev => prev.filter(c => c.clientId !== clientId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not revoke access.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-4xl mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Connected Applications</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Third-Party Apps</CardTitle>
                        <p className="text-sm text-gray-500">You have granted these applications access to your WhatsYour.Info account.</p>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : connections.length > 0 ? (
                            <div className="space-y-4">
                                {connections.map(app => (
                                    <div key={app.clientId} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            {app.appLogo ? <img src={app.appLogo} alt="logo" className="w-10 h-10 rounded-full border" /> : <ShieldQuestion className="w-10 h-10 text-gray-400" />}
                                            <div>
                                                <p className="font-semibold">{app.name}</p>
                                                <p className="text-xs text-gray-500">Authorized on: {new Date(app.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => handleRevoke(app.clientId)}>
                                            <Trash2 className="h-4 w-4 mr-2" />Revoke Access
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-500 py-8">You haven't connected any third-party applications yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}