'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { UserProfile } from '@/types';
import toast from 'react-hot-toast';
import { Upload, Loader2 } from 'lucide-react';

interface AvatarsPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<Pick<UserProfile, 'avatar'>>) => void;
}

export default function AvatarsPanel({ user, onUpdate }: AvatarsPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const avatarUrl = `/api/avatars/${user.username}?t=${Date.now()}`;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading avatar...');

    try {
      const img = await readImage(file);
      const processedBlob = await cropAndCompress(img);

      const formData = new FormData();
      formData.append('avatar', processedBlob, 'avatar.jpg');

      const res = await fetch('/api/avatars/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      toast.success('Avatar updated!', { id: toastId });
      onUpdate({ avatar: `/api/avatars/${user.username}?t=${Date.now()}` });
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong', { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile Avatar</h2>
        <p className="text-gray-500 mt-1">Upload a clear photo of yourself.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-5">
        <div className="relative group">
          <label htmlFor="avatar-upload-input" className="cursor-pointer">
            <img
              src={avatarUrl}
              alt="Current Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg transition-opacity group-hover:opacity-80"
              onError={(e: any) => (e.target.src = '/default-avatar.png')}
            />
          </label>

          {isUploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button asChild variant="outline" disabled={isUploading}>
            <label htmlFor="avatar-upload-input">
              <Upload className="h-4 w-4 mr-2 inline" />
              {isUploading ? 'Uploading...' : 'Change Avatar'}
            </label>
          </Button>
          <input
            id="avatar-upload-input"
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF, or WEBP up to 4MB</p>
        </div>
      </div>
    </div>
  );
}

// ✅ Utility: Read File and Convert to Image Element
async function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Invalid image format'));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ✅ Utility: Crop & Compress Image in Memory (center square, resize to 512px)
async function cropAndCompress(img: HTMLImageElement): Promise<Blob> {
  const size = 512;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  canvas.width = size;
  canvas.height = size;

  const minSide = Math.min(img.width, img.height);
  const sx = (img.width - minSide) / 2;
  const sy = (img.height - minSide) / 2;

  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Compression failed'));
      resolve(blob);
    }, 'image/jpeg', 0.85); // quality: 0.85
  });
}
