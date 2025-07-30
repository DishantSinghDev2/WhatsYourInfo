'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Clipboard, Trash2 } from 'lucide-react';
import { UserProfile } from '@/types';

interface Redirect {
    slug: string;
    url: string;
}

export default function SmartRedirects({ user }: { user: UserProfile }) {
    const [redirects, setRedirects] = useState<Redirect[]>([]);
    const [slug, setSlug] = useState('');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Instant fetch on mount
    useEffect(() => {
        fetchRedirects();
    }, []);

    const fetchRedirects = async () => {
        try {
            const res = await fetch('/api/tools/redirects');
            const data = await res.json();
            setRedirects(data);
        } catch {
            toast.error('Failed to load redirects');
        }
    };

    const addRedirect = async () => {
        if (!slug || !url) return toast.error('Both slug and URL are required.');
        setIsLoading(true);

        try {
            setRedirects((prev) => [...prev, { slug, url }]); // Optimistic update

            const res = await fetch('/api/tools/redirects', {
                method: 'POST',
                body: JSON.stringify({ slug, url }),
            });

            if (!res.ok) throw new Error('Add failed');

            toast.success('Redirect added');
            setSlug('');
            setUrl('');
        } catch {
            toast.error('Failed to add redirect');
            await fetchRedirects(); // Reset UI if error
        } finally {
            setIsLoading(false);
        }
    };

    const deleteRedirect = async (slugToDelete: string) => {
        setRedirects((prev) => prev.filter((r) => r.slug !== slugToDelete));

        try {
            const res = await fetch('/api/tools/redirects', {
                method: 'DELETE',
                body: JSON.stringify({ slug: slugToDelete }),
            });

            if (!res.ok) throw new Error('Delete failed');
            toast.success('Deleted');
        } catch {
            toast.error('Failed to delete');
            await fetchRedirects(); // Reset UI if error
        }
    };

    const copyLink = async (slug: string) => {
        const fullUrl = `${window.location.origin}/${user.username}/${slug}`;
        await navigator.clipboard.writeText(fullUrl);
        toast.success('Copied link to clipboard');
    };

    if (!user?.isProUser) {
        return <p className="text-sm text-muted-foreground">This is a Pro-only feature. Upgrade to create smart redirects.</p>;
    }

    return (
        <div className="space-y-6">
            <div>

                <h2 className="text-xl font-semibold">Smart Redirects</h2>
                <p className="text-sm text-gray-500">Redirect any user from /{user.username}/{slug || '<slug>'} to different URL.</p>
            </div>

            <div className="bg-muted/10 p-4 rounded-md space-y-3">
                <div className="flex gap-2 items-center">
                    <Input
                        placeholder="Slug (e.g., about)"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                    />
                    <Input
                        placeholder="Destination URL (e.g., https://bio.link/me)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <Button onClick={addRedirect} disabled={isLoading}>
                        {isLoading ? 'Adding...' : 'Add'}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Result: <code>{window.location.origin}/{user.username}/{slug || '<slug>'}</code>
                </p>
            </div>

            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Your Redirects:</h3>
                <ul className="space-y-2">
                    <AnimatePresence>
                        {redirects.map((r) => (
                            <motion.li
                                key={r.slug}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center justify-between bg-muted/5 px-4 py-2 rounded-md border"
                            >
                                <div className="flex flex-col text-sm">
                                    <span className="font-medium text-primary">
                                        /{user.username}/{r.slug}
                                    </span>
                                    <a
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-muted-foreground break-all hover:underline"
                                    >
                                        {r.url}
                                    </a>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => copyLink(r.slug)}
                                    >
                                        <Clipboard className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => deleteRedirect(r.slug)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
                {redirects.length === 0 && (
                    <p className="text-sm text-muted-foreground">No redirects added yet.</p>
                )}
            </div>
        </div>
    );
}
