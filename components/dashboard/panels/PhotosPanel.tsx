'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { UploadCloud, Trash2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '@/types';

interface GalleryItem {
  _id: string;
  url: string;
  key: string;
  caption?: string;
}

export interface PhotosPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export default function PhotosPanel({ user, onUpdate }: PhotosPanelProps) {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProUser = user.isProUser

  useEffect(() => {
    if (!isProUser) {
      setIsLoading(false);
      return;
    }

    const fetchPhotos = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/profile/gallery');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch photos.");
        setPhotos(data.items);
      } catch {
        toast.error('Failed to fetch photos.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPhotos();
  }, [isProUser]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading...');
    const formData = new FormData();
    formData.append('photo', file);


    try {
      const res = await fetch('/api/profile/gallery', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      setPhotos(prev => [...prev, data.item]);
      onUpdate({ gallery: [...photos, data.item] })
      toast.success('Photo added!', { id: toastId });
    } catch {
      toast.error('Upload failed.', { id: toastId });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (photoId: string) => {
    const originalPhotos = photos;
    setPhotos(prev => prev.filter(p => p._id !== photoId));
    onUpdate({ gallery: originalPhotos.filter(p => p._id !== photoId) })

    try {
      const res = await fetch(`/api/profile/gallery/${photoId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete photo.');
      toast.success('Photo removed.');
    } catch {
      toast.error('Failed to delete photo.');
      setPhotos(originalPhotos);
    }
  };

  return (
    <div className="text-sm space-y-8" >
      <div>
        <h2 className="text-lg font-semibold">Gallary</h2>
        <p className="text-muted-foreground mt-1">A visual story of your moments.</p>
      </div>

      {!isProUser ? (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto bg-white p-3 rounded-full shadow-sm">
              <Heart className="h-8 w-8 text-blue-500" />
            </div>
            <CardTitle className="mt-4 text-gray-700">Unlock Your Gallery!</CardTitle>
            <CardDescription>Upgrade to a Pro account to share your favorite photos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">Upgrade to Pro</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {photos.map(photo => (
                  <motion.div
                    key={photo._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative group aspect-square"
                  >
                    <img src={photo.url} alt={photo.caption || 'Gallery photo'} className="w-full h-full rounded-lg object-cover shadow-md hover:shadow-xl transition-shadow" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg flex items-center justify-center">
                      <Button variant="destructive" size="icon" className="opacity-0 group-hover:opacity-100 transform group-hover:scale-110 transition-all" onClick={() => handleDelete(photo._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.label
                htmlFor="photo-upload"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="aspect-square w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors"
              >
                <UploadCloud className="h-8 w-8" />
                <span className="text-sm font-medium mt-2">Add Photo</span>
                <input ref={fileInputRef} id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
              </motion.label>
            </div>
            {isLoading && <p className="text-center mt-4 text-gray-500">Loading photos...</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}