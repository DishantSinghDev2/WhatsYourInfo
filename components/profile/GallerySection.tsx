'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { User } from '@/lib/auth';

interface GallerySectionProps {
  username: User['username'];
}

interface GalleryItem {
  _id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
}

export default function GallerySection({ username }: GallerySectionProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const response = await fetch(`/api/users/${username}/gallery`);
        if (!response.ok) {
          throw new Error('Failed to fetch gallery items.');
        }
        const data = await response.json();
        setItems(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, [username]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gallery</CardTitle>
        <Button size="sm" variant="outline">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-gray-500">Loading gallery...</p>}
        {error && (
          <div className="text-red-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-8 col-span-full">
            <p className="text-gray-500">The gallery is empty.</p>
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item._id} className="relative aspect-square">
                <img
                  src={item.url}
                  alt={item.title || 'Gallery item'}
                  className="w-full h-full object-cover rounded-md shadow-md"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}