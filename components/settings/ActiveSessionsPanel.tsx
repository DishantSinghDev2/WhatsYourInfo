// components/settings/ActiveSessionsPanel.tsx

'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Laptop, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface Session {
  id: string;
  isCurrent: boolean;
  userAgent: string;
  ipAddress: string;
  lastUsedAt: string;
}

export function ActiveSessionsPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/settings/sessions');
      if (!res.ok) throw new Error('Could not load sessions.');
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    try {
        await fetch('/api/settings/sessions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });
        toast.success("Session revoked.");
        setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch {
        toast.error("Failed to revoke session.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>This is a list of devices that have logged into your account. Revoke any sessions you do not recognize.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {session.userAgent.toLowerCase().includes('mobile') ? <Smartphone /> : <Laptop />}
                  <div>
                    <p className="font-semibold">{session.userAgent} {session.isCurrent && <span className="text-xs text-green-600 font-medium ml-2">(This device)</span>}</p>
                    <p className="text-xs text-gray-500">Last active: {new Date(session.lastUsedAt).toLocaleString()} • IP: {session.ipAddress}</p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button variant="outline" size="sm" onClick={() => handleRevoke(session.id)}>Sign out</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}