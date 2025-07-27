'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserProfile } from '@/types';
import toast from 'react-hot-toast';
import { UploadCloud, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryItem {
  _id: string;
  url: string;
  title?: string;
}

interface PhotosPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
  changesSaved: (a: boolean) => void
}

export default function PhotosPanel({ user, onUpdate, changesSaved }: PhotosPanelProps) {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch(`/api/users/${user.username}/gallery`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPhotos(data.items);
        changesSaved(true)
      } catch (error) {
        toast.error("Could not load photos.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPhotos();
  }, [user.username]);

  // A real implementation would use a service like Cloudinary or S3 for uploads.
  // This is a simplified example.
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.loading('Uploading photo...', { id: 'photo-upload' });
    // This is where you would upload the file to your storage service.
    // After getting the URL, you post it to your gallery API.
    // const imageUrl = await uploadToCloudStorage(file);
    const imageUrl = "https://via.placeholder.com/400"; // Placeholder URL

    try {
      const res = await fetch(`/api/profile/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'image', url: imageUrl, title: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotos(prev => [...prev, data.item]);
      toast.success('Photo added!', { id: 'photo-upload' });
      changesSaved(true)
    } catch (err) {
      toast.error('Upload failed.', { id: 'photo-upload' });
    }
  };

  const handleDelete = async (photoId: string) => {
    // Implement DELETE /api/users/[username]/gallery/[photoId]
    toast.success(`Photo ${photoId} deleted.`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Photos</h1>
        <p className="text-gray-500">Upload some photos to tell your story visually.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Your Gallery</CardTitle>
          <CardDescription>This is a Pro feature.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {photos.map(photo => (
                <motion.div key={photo._id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="relative group">
                  <img src={photo.url} alt={photo.title || 'Gallery photo'} className="aspect-square w-full rounded-lg object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                    <Button variant="destructive" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => handleDelete(photo._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <label htmlFor="photo-upload" className="aspect-square w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 cursor-pointer transition-colors">
              <UploadCloud className="h-8 w-8" />
              <span className="text-sm mt-2">Upload Photo</span>
              <input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}