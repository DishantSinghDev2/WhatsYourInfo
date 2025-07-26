'use client';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SiX, SiLinkedin, SiGithub, SiPaypal, SiBitcoin } from 'react-icons/si';
import { Globe, MoreVertical, Link as LinkIcon } from 'lucide-react';
import VerifiedTick from './VerifiedTick';
import { AdvancedDetailsDialog } from './AdvancedDetailsDialog';

const iconMap: { [key: string]: React.ElementType } = {
  twitter: SiX,
  linkedin: SiLinkedin,
  github: SiGithub,
  website: Globe,
  'paypal.me': SiPaypal,
  'bitcoin (btc)': SiBitcoin,
};

export default function PublicProfileView({ profile, isPreview = false }: { profile: UserProfile; isPreview?: boolean }) {
  const background = profile.design?.customColors?.background || '#ffffff';
  const accent = profile.design?.customColors?.accent || '#111827';

  const isGradient = (value: string) => value?.startsWith('linear-gradient');

  const containerStyle = isGradient(background)
    ? { backgroundImage: background }
    : { backgroundColor: background };

  const textStyle = isGradient(accent)
    ? {
        backgroundImage: accent,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }
    : {
        color: accent,
      };

  return (
    <div className="min-h-screen transition-colors duration-500" style={containerStyle}>
      <div
        className="h-48 bg-gray-200"
        style={{
          backgroundImage: `url(${profile.design?.headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <img
              src={`/api/avatars/${profile.username}?t=${Date.now()}`}
              className="w-36 h-36 rounded-md border-4 object-cover"
              style={{ borderColor: background }}
              alt={`${profile.firstName}'s avatar`}
              onError={(e: any) => (e.target.src = '/default-avatar.png')}
            />
            <div className="pb-2 sm:pb-0">
              <h1
                className="text-2xl sm:text-3xl font-bold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                style={textStyle}
              >
                <span>
                  {profile.firstName} {profile.lastName}
                </span>
                <VerifiedTick isPro={profile.isProUser} />
              </h1>
              <p className="text-base sm:text-lg opacity-70">@{profile.username}</p>
            </div>
          </div>

          <div className="absolute top-24 right-0 sm:relative sm:top-0 sm:right-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Share Profile</DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={`/api/vcard/${profile.username}`} download>
                    Download vCard
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <AdvancedDetailsDialog profile={profile} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Verified Accounts */}
        <div className="mt-4">
          {profile.verifiedAccounts?.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2 justify-center sm:justify-start">
              {profile.verifiedAccounts.map((acc) => {
                const Icon = iconMap[acc.provider.toLowerCase()];
                return (
                  <a
                    key={acc.provider}
                    href={acc.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 hover:bg-black/10 rounded"
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Bio + Sidebar */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {profile.bio && (
              <div className="p-5 bg-black/5 rounded-md">
                <h2 className="text-xl font-semibold mb-3">About</h2>
                <p className="opacity-80 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {profile.links?.length > 0 && (
              <div className="p-5 bg-black/5 rounded-md">
                <h3 className="font-semibold mb-3">Links</h3>
                <div className="space-y-2">
                  {profile.links.map((link) => (
                    <a
                      key={link._id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 hover:bg-black/10 rounded"
                    >
                      <LinkIcon className="h-4 w-4 opacity-60" />
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {!profile.isProUser && !isPreview && (
          <footer className="mt-16 py-8 border-t text-center text-sm opacity-60">
            <p className="font-bold text-lg mb-2">What'sYour.Info</p>
            <div className="flex justify-center gap-4 mb-4">
              <a href="/terms" className="hover:underline">
                Terms
              </a>
              <a href="/privacy" className="hover:underline">
                Privacy Policy
              </a>
            </div>
            <Button variant="default">Upgrade to Pro</Button>
          </footer>
        )}
      </div>
    </div>
  );
}
