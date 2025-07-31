// components/WebCardView.tsx

'use client';

import { UserProfile } from '@/types';
import tinycolor from 'tinycolor2';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Download, ArrowRight } from 'lucide-react';
import { SiX, SiLinkedin, SiGithub } from 'react-icons/si';

// Icon map for verified social accounts
const iconMap: { [key: string]: React.ElementType } = {
  twitter: SiX,
  linkedin: SiLinkedin,
  github: SiGithub,
};

// Helper function to check if a color is dark
function isDarkColor(color: string): boolean {
  try {
    return tinycolor(color).isDark();
  } catch {
    return false;
  }
}

export default function WebCardView({ profile }: { profile: UserProfile }) {
  // --- Dynamic Style Calculations ---
  const { design } = profile;
  const background = design?.customColors?.background || '#FFFFFF';
  const accent = design?.customColors?.accent || '#111827';
  
  const backgroundBlur = design?.backgroundBlur ?? 0;
  const backgroundOpacity = design?.backgroundOpacity ?? 100;

  const colorOverlayStyle: React.CSSProperties = {
    backgroundColor: background,
    opacity: backgroundOpacity / 100,
  };

  const forceLightText = isDarkColor(background);
  const accentButtonStyle: React.CSSProperties = {
    backgroundColor: accent,
    color: isDarkColor(accent) ? '#FFFFFF' : '#000000',
  };

  return (
    <>
      {/* Background Image Layer (Fixed) */}
      {design?.backgroundImage && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${design.backgroundImage})`,
            filter: `blur(${backgroundBlur}px)`,
          }}
        />
      )}
      
      {/* Color Overlay Layer (Fixed) */}
      <div className="fixed inset-0 z-10" style={colorOverlayStyle} />

      {/* Main Content Layer */}
      <main className={`relative z-20 min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-500 ${forceLightText ? 'text-white' : 'text-gray-800'}`}>
        
        {/* The Centered Web Card */}
        <div className="w-full max-w-sm rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl shadow-2xl border border-white/20 overflow-hidden text-center p-8 flex flex-col items-center">
            
            {/* Avatar */}
            <Image
              src={`/api/v1/avatars/${profile.username}`}
              alt={`${profile.firstName}'s avatar`}
              width={128}
              height={128}
              className="w-32 h-32 rounded-full object-cover border-4 shadow-lg"
              style={{ borderColor: accent }}
              onError={(e: any) => (e.target.src = '/default-avatar.png')}
            />

            {/* User Info */}
            <h1 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">
                {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-gray-500 dark:text-gray-300">@{profile.username}</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 mt-4 max-w-xs">
                {profile.bio}
            </p>

            {/* Verified Social Icons */}
            {profile.verifiedAccounts && profile.verifiedAccounts.length > 0 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    {profile.verifiedAccounts.map((acc) => {
                        const Icon = iconMap[acc.provider.toLowerCase()];
                        return Icon ? (
                            <a key={acc.provider} href={acc.profileUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                                <Icon className="h-6 w-6" />
                            </a>
                        ) : null;
                    })}
                </div>
            )}
            
            {/* Action Buttons */}
            <div className="w-full space-y-3 mt-8">
                <Button asChild className="w-full" style={accentButtonStyle}>
                    <a href={`/api/vcard/${profile.username}`} download>
                        <Download className="h-4 w-4 mr-2"/>
                        Save to Contacts
                    </a>
                </Button>
                <Button asChild variant="outline" className="w-full bg-white/50 dark:bg-black/20 dark:text-white dark:border-white/20">
                    <Link href={`/${profile.username}`}>
                        View Full Profile
                        <ArrowRight className="h-4 w-4 ml-2"/>
                    </Link>
                </Button>
            </div>
        </div>
        
        {/* Footer Link to your service */}
        <footer className="absolute bottom-4 text-center w-full">
            <Link href="/" className={`text-sm ${forceLightText ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                Powered by <strong>WhatsYour.Info</strong>
            </Link>
        </footer>
      </main>
    </>
  );
}