'use client';

import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  SiX,
  SiLinkedin,
  SiGithub,
  SiPaypal,
  SiBitcoin,
  SiEthereum,
  SiMoneygram,
} from 'react-icons/si';
import {
  Globe,
  Share2,
  Download,
  Link as LinkIcon,
} from 'lucide-react';
import VerifiedTick from './VerifiedTick';
import { AdvancedDetailsDialog } from './AdvancedDetailsDialog';
import tinycolor from 'tinycolor2';
import Link from 'next/link';
import Image from 'next/image';
import LeadCaptureForm from '../LeadCaptureForm';
import VerifiedAccountsSection from './VerifiedAccountsSection';
import { useState } from 'react';
import GalleryModal from '../ui/GalleryModal';

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
  'paypal.me': SiPaypal,
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

const DEFAULT_SECTIONS = [
  'Introduction',
  'Links',
  'Wallet',
  'Gallery',
  'VerifiedAccounts',
  'Interests',
  'LeadCapture',
];
const DEFAULT_VISIBILITY = DEFAULT_SECTIONS.reduce(
  (acc, sec) => ({ ...acc, [sec]: true }),
  {}
);

export default function PublicProfileView({
  profile,
  // isPreview = false,
}: {
  profile: UserProfile;
  // isPreview?: boolean;
}) {
  const background =
    profile.design?.customColors?.background || '#ffffff';
  const accent = profile.design?.customColors?.accent || '#111827';
  const backgroundImage = profile.design?.backgroundImage || '';
  const backgroundBlur = profile.design?.backgroundBlur || 0;
  const backgroundOpacity =
    (profile.design?.backgroundOpacity ?? 100) / 100;

  const containerStyle = isGradient(background)
    ? { backgroundImage: background }
    : { backgroundColor: background };
  const textStyle = isGradient(accent)
    ? {
      backgroundImage: accent,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }
    : { color: accent };
  const forceLightText = isDarkColor(
    isGradient(background) ? '#000000' : background
  );
  const accentButtonStyle = {
    backgroundColor: accent,
    color: isDarkColor(accent) ? '#fff' : '#000',
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);


  const sectionOrder = profile.design?.sections || DEFAULT_SECTIONS;
  const visibility =
    profile.design?.visibility || DEFAULT_VISIBILITY;

  const sectionComponents: { [key: string]: React.ReactNode | null } = {
    Introduction: (
      <div className="p-5 bg-black/5 rounded-md">
        <h2 className="text-xl font-semibold mb-3">About</h2>
        {profile.bio ? (
          <p className="opacity-80 leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        ) : (
          <p className="opacity-60">No bio provided.</p>
        )}
      </div>
    ),
    Spotlight: profile.spotlightButton ? (
      <a
        href={profile.spotlightButton.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-3 rounded-md text-center font-semibold"
        style={accentButtonStyle}
      >
        {profile.spotlightButton.text}
      </a>
    ) : null,
    Links:
      profile.links && profile.links.length > 0 ? (
        <div className="p-5 bg-black/5 rounded-md">
          <h3 className="text-xl font-semibold mb-3">Links</h3>
          <div className="space-y-2">
            {profile.links.map((link) => (
              <a
                key={link._id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 hover:bg-black/10 rounded transition-colors"
              >
                <LinkIcon className="h-4 w-4 opacity-60" />
                <span>{link.title}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null,
    Wallet:
      profile.wallet &&
        profile.wallet.length > 0 &&
        profile.showWalletOnPublic ? (
        <div className="p-5 bg-black/5 rounded-md">
          <h3 className="text-xl font-semibold mb-3">Wallet</h3>
          <div className="space-y-3 text-sm">
            {profile.wallet.map((w) => {
              const WalletIcon =
                walletIconMap[w.paymentType.toLowerCase()] || Globe;
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-2"
                >
                  <WalletIcon className="h-4 w-4 mt-1 opacity-70" />
                  <div>
                    <p className="font-semibold">{w.paymentType}</p>
                    <p className="opacity-80 break-all">
                      {w.address}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null,
    Gallery:
      profile.gallery && profile.gallery.length > 0 ? (
        <div className="p-5 bg-black/5 rounded-md">
          <h3 className="text-xl font-semibold mb-3">Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {profile.gallery.map((item, idx) => (
              <div
                key={idx}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedImageIndex(idx);
                  setModalOpen(true);
                }}
              >
                <img
                  src={item.url || (`https://whatsyourinfo-media-worker.dishis.workers.dev/${item.key}`)}
                  alt={item.caption || 'Gallery image'}
                  className="rounded-md object-cover w-full h-28"
                  loading="lazy"
                />
                {item.caption && (
                  <p className="text-xs mt-1 opacity-80">
                    {item.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null,

    VerifiedAccounts:
      profile.verifiedAccounts &&
        profile.verifiedAccounts.length > 0 ? (
        <VerifiedAccountsSection
          verifiedAccounts={profile.verifiedAccounts}
          design={profile.design}
          isPro={profile.isProUser}
        />
      ) : null,
    Interests:
      profile.interests && profile.interests.length > 0 ? (
        <div className="p-5 bg-black/5 rounded-md">
          <h3 className="text-xl font-semibold mb-3">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="bg-black/10 text-sm rounded-full px-3 py-1.5"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      ) : null,
    LeadCapture: profile.isProUser ? (
      <LeadCaptureForm
        username={profile.username}
        design={profile.design}
      />
    ) : null,
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/default-avatar.png'; // or any default image path
  };
  

  return (
    <>
      <div
        className={`min-h-screen pb-5 transition-colors duration-500 ${forceLightText ? 'text-white' : 'text-black'
          }`}
        style={containerStyle}
      >
        {/* HEADER */}
        <div
          className="h-48 bg-gray-200"
          style={{
            backgroundImage: `url(${profile.design?.headerImage || (profile.isProUser ? '/pro-header.png' : '/header.png')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* MAIN WRAPPER */}
        <div className="relative z-0">
          {/* BG IMAGE OVERLAY (Underneath everything but header) */}
          {backgroundImage && profile.isProUser && (
            <div
              className="absolute inset-0 top-20 z-[-1] pointer-events-none"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `blur(${backgroundBlur}px)`,
                opacity: backgroundOpacity,
              }}
            />
          )}

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* USER INFO */}
            <div className="relative flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-20">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                <img
                  src={`/api/avatars/${profile.username}?t=${Date.now()}`}
                  width={144}
                  height={144}
                  className="w-36 h-36 rounded-md border-4 object-cover bg-white"
                  style={{ borderColor: background }}
                  alt={`${profile.firstName}'s avatar`}
                  onError={handleImageError}
                />
                <div className="pb-2 sm:pb-0">
                  <h1
                    className="text-2xl sm:text-3xl font-bold flex flex-row items-center gap-1 sm:gap-2"
                    style={textStyle}
                  >
                    <span>
                      {profile.firstName} {profile.lastName}
                    </span>
                    {profile.emailVerified && (
                      <VerifiedTick isPro={profile.isProUser} />
                    )}
                  </h1>
                  <p className="text-base sm:text-lg opacity-70">
                    @{profile.username}
                  </p>
                </div>
              </div>
              <div className="absolute top-24 right-0 sm:relative sm:top-0 sm:right-0 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    navigator.share?.({
                      title: 'Check my profile',
                      url: window.location.href,
                    })
                  }
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={`/api/vcard/${profile.username}`}
                    download
                  >
                    <Download className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>

            {/* VERIFIED ICONS */}
            {profile.verifiedAccounts?.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                {profile.verifiedAccounts.map((acc) => {
                  const Icon = iconMap[acc.provider.toLowerCase()];
                  return Icon ? (
                    <a
                      key={acc.provider}
                      href={acc.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-black/10 rounded-full transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ) : null;
                })}
              </div>
            )}

            {/* DYNAMIC CONTENT */}
            <div className="mt-8 space-y-6">
              {sectionOrder.map((key) => {
                const component = sectionComponents[key];
                return visibility[key] && component ? (
                  <div key={key}>{component}</div>
                ) : null;
              })}
            </div>

            <div className="mt-12 flex justify-center">
              <AdvancedDetailsDialog profile={profile} />
            </div>

            {/* FOOTER */}
            {!profile.isProUser && (
              <footer className="mt-16 py-8 border-t flex md:flex-row flex-col w-full justify-center md:justify-between text-sm md:gap-0 gap-5 items-center">
                <Link
                  href="/"
                  className="-m-1.5 p-1.5 flex items-center justify-center space-x-2"
                >
                  <Image
                    src="/logotext.svg"
                    alt="WhatsYour.Info"
                    width={160}
                    height={28}
                  />
                </Link>
                <div className="flex justify-center md:items-center gap-4">
                  <Link href="/terms" className="hover:underline">
                    Terms
                  </Link>
                  <Link href="/privacy" className="hover:underline">
                    Privacy Policy
                  </Link>
                </div>
                <Link href="/register">
                  <Button style={accentButtonStyle}>
                    Create Your Profile
                  </Button>
                </Link>
              </footer>
            )}
          </div>
        </div>
      </div>
      {modalOpen && (
        <GalleryModal
          images={profile.gallery}
          initialIndex={selectedImageIndex}
          onClose={() => setModalOpen(false)}
        />
      )}

    </>

  );
}
