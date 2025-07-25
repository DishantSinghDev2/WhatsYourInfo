'use client';
import { User } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { QrCode, Share2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import QRCode from 'react-qr-code';

export default function ProfileHeader({ profile }: { profile: User }) {
  const profileUrl = `https://whatsyour.info/${profile.username}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-6">
        <img
          src={`/api/avatars/${profile.username}`}
          alt={`${profile.firstName} ${profile.lastName}`}
          className="h-24 w-24 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{`${profile.firstName} ${profile.lastName}`}</h1>
              <p className="text-md text-gray-500">@{profile.username}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-4">
                  <QRCode value={profileUrl} size={128} />
                  <p className="text-center text-sm mt-2 text-gray-600">Scan to view profile</p>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
      {profile.isProUser && profile.spotlightButton && (
  <Button
    size="lg"
    style={{ backgroundColor: profile.spotlightButton.color }}
    className="mt-4"
    asChild
  >
    <a href={profile.spotlightButton.url} target="_blank" rel="noopener noreferrer">
      {profile.spotlightButton.text}
    </a>
  </Button>
)}
    </div>
  );
}