// app/tools/link-shortener/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Copy, Trash2, Link as LinkIcon, Plus, Loader2, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { User } from '@/lib/auth';

interface ShortLink {
  _id: string;
  slug: string;
  destinationUrl: string;
  clickCount: number;
  createdAt: string;
}

export default function LinkShortenerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newSlug, setNewSlug] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [userRes, linksRes] = await Promise.all([
          fetch('/api/auth/user'),
          fetch('/api/tools/shortlinks')
        ]);
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
          // Pre-fill destination with the user's profile URL
          setNewDestination(`https://whatsyour.info/${userData.user.username}`);
        }
        
        if (linksRes.ok) {
          setLinks(await linksRes.json());
        }
      } catch (error) {
        toast.error("Failed to load your data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/tools/shortlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug, destinationUrl: newDestination }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLinks(prev => [data, ...prev]);
      setNewSlug(''); // Clear slug input
      toast.success("Short link created successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create link.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to permanently delete this short link?')) return;
    
    try {
      const res = await fetch(`/api/tools/shortlinks/${linkId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      
      setLinks(prev => prev.filter(link => link._id !== linkId));
      toast.success("Short link deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete link.");
    }
  };

  const copyToClipboard = (slug: string) => {
    const url = `https://whatsyour.info/go/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Short link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Link Shortener</h1>
          <p className="text-gray-600 mt-2">Create short, branded, and trackable links for your profile.</p>
        </div>

        {/* Create New Link Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create a New Short Link</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-end gap-2">
                <div className="flex-shrink-0">
                  <label className="text-sm font-medium">Domain</label>
                  <div className="p-2 border rounded-md bg-gray-100 text-gray-600">
                    whatsyour.info/go/
                  </div>
                </div>
                <div className="flex-grow">
                  <label htmlFor="slug" className="text-sm font-medium">Custom Slug</label>
                  <Input id="slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="my-portfolio" required />
                </div>
              </div>
              <div>
                <label htmlFor="destination" className="text-sm font-medium">Destination URL</label>
                <Input id="destination" type="url" value={newDestination} onChange={e => setNewDestination(e.target.value)} placeholder="https://..." required />
              </div>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {isCreating ? 'Creating...' : 'Create Link'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Links List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Short Links</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
            ) : links.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">You haven't created any short links yet.</p>
            ) : (
              <div className="space-y-4">
                {links.map(link => (
                  <div key={link._id} className="p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-grow">
                      <p className="font-semibold text-blue-600 break-all">whatsyour.info/go/{link.slug}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 break-all">
                        <LinkIcon className="h-3 w-3" /> {link.destinationUrl}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                       <div className="flex items-center text-sm font-medium text-gray-700 p-2 bg-gray-100 rounded-md">
                           <BarChart2 className="h-4 w-4 mr-2 text-purple-600"/> Clicks: {link.clickCount}
                       </div>
                       <Button size="sm" variant="outline" onClick={() => copyToClipboard(link.slug)}><Copy className="h-4 w-4"/></Button>
                       <Button size="sm" variant="destructive" onClick={() => handleDeleteLink(link._id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}