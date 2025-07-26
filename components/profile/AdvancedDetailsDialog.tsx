'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import { Globe, Star, CheckCircle, Clock } from 'lucide-react';
import { UserProfile } from '@/types';

export function AdvancedDetailsDialog({ profile }: { profile: UserProfile }) {
  const themeStyles = {
    backgroundColor: profile.design?.customColors?.background || '#ffffff',
    color: profile.design?.customColors?.accent || '#111827',
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Advanced details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 shadow-lg">
        <div className="grid md:grid-cols-2 bg-white" style={themeStyles}>
          {/* Left Side: Info Card */}
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold mb-2">Profile Details</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-4">
              <img
                src={`/api/avatars/${profile.username}?t=${Date.now()}`}
                className="w-16 h-16 rounded-full object-cover border"
                alt={`${profile.firstName}'s avatar`}
              />
              <div>
                <p className="font-semibold text-lg">{profile.firstName} {profile.lastName}</p>
                <a
                  href={`/user/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  View profile →
                </a>
              </div>
            </div>

            <div className="text-sm space-y-2">
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4 opacity-70" />
                <span>Profile: <strong>Personal</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <Star className="w-4 h-4 opacity-70" />
                Updated: {new Date(profile.updatedAt).toUTCString()}
              </p>
              <p className="flex items-center gap-2">
                <Star className="w-4 h-4 opacity-70" />
                Created: {new Date(profile.createdAt).toUTCString()}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 opacity-70" />
                Time: {new Date().toUTCString()}
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Verified connections: {profile.verifiedAccounts?.length || 0}
              </p>
            </div>

            {!profile.isProUser && (
              <div className="pt-4 text-xs opacity-50 border-t mt-4">
                <p>Powered by <strong>WhatsYour.Info</strong></p>
              </div>
            )}
          </div>

          {/* Right Side: QR + vCard download */}
          <div className="p-6 bg-black/5 flex flex-col gap-3 items-start justify-center text-sm">
            <p><strong>Links</strong></p>
            <a
              href={`https://gravatar.com/${profile.username}.card`}
              className="hover:underline text-blue-600"
              target="_blank"
            >
              gravatar.com/{profile.username}.card
            </a>
            <div className="flex flex-col gap-2 mt-3">
              <a href={`/api/vcard/${profile.username}`} download className="text-blue-600 hover:underline">Download vCard</a>
              <a href={`/qr/${profile.username}?type=logo`} className="text-blue-600 hover:underline">QR - Logo</a>
              <a href={`/qr/${profile.username}?type=avatar`} className="text-blue-600 hover:underline">QR - Avatar</a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
