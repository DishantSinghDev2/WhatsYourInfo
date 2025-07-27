'use client';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import { SiX, SiLinkedin, SiGithub, SiPaypal, SiBitcoin, SiEthereum, SiMoneygram } from 'react-icons/si';
import { Globe, Share2, Download, Settings, Link as LinkIcon } from 'lucide-react';
import VerifiedTick from './VerifiedTick';
import { AdvancedDetailsDialog } from './AdvancedDetailsDialog';
import tinycolor from 'tinycolor2';
import Link from 'next/link';
import Image from 'next/image';
import LeadCaptureForm from '../LeadCaptureForm';

const iconMap: { [key: string]: React.ElementType } = {
  twitter: SiX,
  linkedin: SiLinkedin,
  github: SiGithub,
  website: Globe,
  'paypal.me': SiPaypal,
  'bitcoin (btc)': SiBitcoin,
};

const walletIconMap: Record<string, React.ElementType> = {
  bitcoin: SiBitcoin,
  btc: SiBitcoin,
  paypal: SiPaypal,
  ethereum: SiEthereum,
  eth: SiEthereum,
  bank: SiMoneygram,
};

function isGradient(value: string) {
  return value?.startsWith('linear-gradient');
}

function isDarkColor(color: string) {
  try {
    return tinycolor(color).isDark();
  } catch {
    return false;
  }
}

export default function PublicProfileView({
  profile,
  isPreview = false
}: {
  profile: UserProfile;
  isPreview?: boolean;
}) {
  const background = profile.design?.customColors?.background || '#ffffff';
  const accent = profile.design?.customColors?.accent || '#111827';

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

  const forceLightText = isDarkColor(
    isGradient(background) ? '#000000' : background
  );

  const accentButtonStyle = {
    backgroundColor: accent,
    color: isDarkColor(accent) ? '#fff' : '#000'
  };

  return (
    <div
      className={`min-h-screen pb-5 transition-colors duration-500 ${forceLightText ? 'text-white' : 'text-black'
        }`}
      style={containerStyle}
    >
      <div
        className="h-48 bg-gray-200"
        style={{
          backgroundImage: `url(${profile.design?.headerImage || profile.isProUser ? "/pro-header.png" : "/header.png"})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
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

          <div className="absolute top-24 right-0 sm:relative sm:top-0 sm:right-0 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                navigator.share?.({
                  title: 'Check my profile',
                  url: window.location.href
                })
              }
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href={`/api/vcard/${profile.username}`} download>
                <Download className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>

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

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {profile.bio && (
              <div className="p-5 bg-black/5 rounded-md">
                <h2 className="text-xl font-semibold mb-3">About</h2>
                <p className="opacity-80 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}
            {profile.spotlightButton && (
              <a
                href={profile.spotlightButton.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 rounded-md text-center font-semibold"
                style={accentButtonStyle}
              >
                {profile.spotlightButton.text}
              </a>
            )}
          </div>

          <div className="space-y-6">
            {profile.links && profile.links?.length > 0 && (
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

            {profile.wallet && profile.wallet?.length > 0 && profile.showWalletOnPublic && (
              <div className="p-5 bg-black/5 rounded-md">
                <h3 className="font-semibold mb-3">Wallet</h3>
                <div className="space-y-3 text-sm">
                  {profile.wallet.map((w) => {
                    const WalletIcon = walletIconMap[w.paymentType.toLowerCase()] || Globe;
                    return (
                      <div key={w.id} className="flex items-start gap-2">
                        <WalletIcon className="h-4 w-4 mt-1 opacity-70" />
                        <div>
                          <p className="font-semibold">{w.paymentType}</p>
                          <p className="opacity-80 break-words">{w.address}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {profile.gallery && profile.gallery?.length > 0 && (
              <div className="p-5 bg-black/5 rounded-md">
                <h3 className="font-semibold mb-3">Gallery</h3>
                <div className="grid grid-cols-2 gap-2">
                  {profile.gallery.map((item, idx) => (
                    <div key={idx}>
                      <img
                        src={item.imageUrl}
                        alt={item.caption}
                        className="rounded-md object-cover w-full h-24"
                      />
                      {item.caption && <p className="text-xs mt-1">{item.caption}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {profile.isProUser && (
          <LeadCaptureForm username={profile.username} design={profile.design} />
        )}


        <div className="mt-12 flex justify-center">
          <AdvancedDetailsDialog profile={profile} />
        </div>

        {!profile.isProUser && !isPreview && (
          <footer className="mt-16 py-8 border-t flex md:flex-row flex-col w-full justify-center md:justify-between text-sm">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
              <Image
                src="/logotext.svg"
                alt="WhatsYour.Info"
                width={200}
                height={32}
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </div>
            {
              <Button style={accentButtonStyle}>Upgrade to Pro</Button>}
          </footer>
        )}
      </div>
    </div>
  );
}
