'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import AvatarCropDialog from '@/components/AvatarCrop'; // This component you already have
import { UserProfile } from '@/types';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

interface AvatarsPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
  changesSaved: (a: boolean) => void
}

export default function AvatarsPanel({ user, onUpdate, changesSaved }: AvatarsPanelProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  // The primary avatar source, prioritizing the live preview
  const currentAvatarSrc = avatarPreview || `/api/avatars/${user.username}?t=${new Date().getTime()}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setIsCropDialogOpen(true);
      changesSaved(false)
    }
  };

  const handleUploadConfirm = async (blob: Blob) => {
    setIsUploading(true);
    const toastId = toast.loading('Uploading avatar...');
    const formData = new FormData();
    formData.append('avatar', blob, avatarFile?.name || 'avatar.png');

    try {
      const response = await fetch('/api/avatar/upload', { // Uses your existing upload API
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      const newAvatarUrl = URL.createObjectURL(blob);
      setAvatarPreview(newAvatarUrl); // Set temporary preview
      onUpdate({ avatar: newAvatarUrl }); // Update parent state for live preview

      toast.success('Avatar updated!', { id: toastId });
      changesSaved(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload error.', { id: toastId });
    } finally {
      setIsUploading(false);
      setAvatarFile(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Avatars</h1>
        <p className="text-gray-500">Your avatar is your identity across the web.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current Avatar</CardTitle>
          <CardDescription>
            This image represents you. Upload a clear, friendly photo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <img
            src={currentAvatarSrc}
            alt="Current Avatar"
            className="w-40 h-40 rounded-full object-cover border-4 border-gray-100 shadow-md"
          />
          <div className="relative">
            <Button asChild>
              <label htmlFor="avatar-upload">
                <Upload className="h-4 w-4 mr-2"/>
                Upload New Image
              </label>
            </Button>
            <input 
              id="avatar-upload"
              type="file" 
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
              className="sr-only" // Visually hidden, triggered by the button
            />
            {isUploading && <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}
          </div>
        </CardContent>
      </Card>

      {avatarFile && (
        <AvatarCropDialog
          isOpen={isCropDialogOpen}
          setIsOpen={setIsCropDialogOpen}
          file={avatarFile}
          onConfirm={handleUploadConfirm}
        />
      )}

      {/* Future section for managing multiple avatars could go here */}
    </div>
  );
}