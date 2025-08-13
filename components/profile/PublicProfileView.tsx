'use client';

import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  SiX, SiLinkedin, SiGithub, SiPaypal, SiBitcoin, SiEthereum,
} from 'react-icons/si';
import {
  Globe, Share2, Download, Link as LinkIcon, Mail, Lock,
  Loader2,
  Landmark,
  WalletIcon,
  Eye
} from 'lucide-react';
import VerifiedTick from './VerifiedTick';
import { AdvancedDetailsDialog } from './AdvancedDetailsDialog';
import tinycolor from 'tinycolor2';
import Link from 'next/link';
import Image from 'next/image';
import LeadCaptureForm from '../LeadCaptureForm';
import VerifiedAccountsSection from './VerifiedAccountsSection';
import { useEffect, useState } from 'react';
import GalleryModal from '../ui/GalleryModal';
import { SiWhatsapp, SiFacebook } from 'react-icons/si';
import {
  SiVenmo, SiPatreon,
  SiDogecoin, SiBuymeacoffee, SiKofi, SiCashapp, SiSolana, SiRipple, SiCardano
} from 'react-icons/si';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

// This part of the file remains unchanged...
const iconMap: { [key: string]: React.ElementType } = {
  twitter: SiX,
  linkedin: SiLinkedin,
  github: SiGithub,
  website: Globe,
  'paypal.me': SiPaypal,
  'bitcoin (btc)': SiBitcoin,
};
const walletIconMap: Record<string, React.ElementType> = {
  'PayPal.me': SiPaypal,
  'Venmo': SiVenmo,
  'Cash App': SiCashapp,
  'Patreon': SiPatreon,
  'BuyMeACoffee': SiBuymeacoffee,
  'Ko-fi': SiKofi,
  'Bitcoin (BTC)': SiBitcoin,
  'Ethereum (ETH)': SiEthereum,
  'Solana (SOL)': SiSolana,
  'Cardano (ADA)': SiCardano,
  'Ripple (XRP)': SiRipple,
  'Dogecoin (DOGE)': SiDogecoin,
  'Custom Payment': Landmark, // Generic icon for custom payments
  'Custom Currency': WalletIcon, // Generic icon for custom currencies

};
function isGradient(value: string) { return value?.startsWith('linear-gradient'); }
function isDarkColor(color: string) { try { return tinycolor(color).isDark(); } catch { return false; } }
const DEFAULT_SECTIONS = [
  'Introduction', 'Links', 'Wallet', 'Gallery', 'VerifiedAccounts', 'Interests', 'LeadCapture',
];
const DEFAULT_VISIBILITY = DEFAULT_SECTIONS.reduce(
  (acc, sec) => ({ ...acc, [sec]: true }), {}
);

// --- NEW, ROBUST COMPONENT TO RENDER THE ACTUAL PROFILE CONTENT ---
const ProfileContent = ({ profile, isPreview }: { profile: UserProfile; isPreview?: boolean; }) => {
  // All existing setup logic is preserved
  const background = profile.design?.customColors?.background || '#ffffff';
  const accent = profile.design?.customColors?.accent || '#111827';
  const backgroundImage = profile.design?.backgroundImage || '';
  const backgroundBlur = profile.design?.backgroundBlur || 0;
  const backgroundOpacity = (profile.design?.backgroundOpacity ?? 100) / 100;
  const containerStyle = isGradient(background) ? { backgroundImage: background } : { backgroundColor: background };
  const textStyle = isGradient(accent) ? { backgroundImage: accent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: accent };
  const forceLightText = isDarkColor(isGradient(background) ? '#000000' : background);
  const accentButtonStyle = { backgroundColor: accent, color: isDarkColor(accent) ? '#fff' : '#000' };

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const sectionOrder = profile.design?.sections || DEFAULT_SECTIONS;
  const visibility = profile.design?.visibility || DEFAULT_VISIBILITY;

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = `${process.env.NEXT_PUBLIC_APP_URL}/api/vcard/${profile.username}`;
      a.download = '';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => setIsDownloading(false), 1200); // simulate download completion
    }
  };

  const shareOptions = [
    {
      label: 'WhatsApp',
      icon: <SiWhatsapp className="w-4 h-4 text-green-600" />,
      url: `https://wa.me/?text=Check%20out%20my%20profile:%20${window.location.href}`,
    },
    {
      label: 'X',
      icon: <SiX className="w-4 h-4 text-blue-400" />,
      url: `https://twitter.com/intent/tweet?url=${window.location.href}&text=Check%20my%20profile`,
    },
    {
      label: 'LinkedIn',
      icon: <SiLinkedin className="w-4 h-4 text-blue-700" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`,
    },
    {
      label: 'Facebook',
      icon: <SiFacebook className="w-4 h-4 text-blue-600" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`,
    },
  ];

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
                walletIconMap[w.paymentType] || Globe;
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-2"
                >
                  <WalletIcon className="h-4 w-4 mt-1 opacity-70" />
                  <div className=''>
                    <p className="font-semibold">{w.paymentType}</p>
                    <a href={w.address} target="_blank" className="text-sm opacity-80 break-all text-blue-500 hover:underline transition duration-100">
                      {w.address}
                    </a>
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
                  src={item.url || (`https://m.wyi.dishis.tech/${item.key}`)}
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = '/default-avatar.png'; };

  const displayName = profile.type === 'business' && profile.businessName
    ? profile.businessName
    : `${profile.firstName} ${profile.lastName}`;

  const displayHandle = (profile.type === 'official' && profile.designation)
    ? profile.designation
    : profile.type === 'business' && profile.username === 'dishis' ? 'Parent Company' : `@${profile.username}`;

  return (
    <>
      {isPreview && profile.profileVisibility === 'private' && (
        <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 p-3 text-center text-sm font-semibold sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span>This is a preview of your private profile. Only you can see this.</span>
          </div>
        </div>
      )}
      <div
        className={`min-h-screen pb-0 transition-colors duration-500 ${forceLightText ? 'text-white' : 'text-black'}`}
        style={containerStyle}
      >
        <div
          className="h-48 bg-gray-200"
          style={{ backgroundImage: `url(${profile.design?.headerImage || (profile.isProUser ? '/pro-header.png' : '/header.png')})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative z-0">
          {backgroundImage && profile.isProUser && (
            <div
              className="absolute inset-0 top-20 z-[-1] pointer-events-none"
              style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: `blur(${backgroundBlur}px)`, opacity: backgroundOpacity }}
            />
          )}

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-20">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                <img
                  src={`/api/avatars/${profile.username}?t=${Date.now()}`}
                  width={144}
                  height={144}
                  className="w-36 h-36 rounded-md border-4 object-cover bg-white"
                  style={{ borderColor: background }}
                  alt={`${displayName}'s avatar`}
                  onError={handleImageError}
                />
                <div className="pb-2 sm:pb-0">
                  <h1 className="text-2xl sm:text-3xl font-bold flex flex-row items-center gap-2" style={textStyle}>
                    <span>{displayName}</span>
                    <VerifiedTick profile={profile} />
                  </h1>
                  <p className="text-base sm:text-lg opacity-70">
                    {displayHandle}
                  </p>
                </div>
              </div>
              <motion.div
                className="absolute top-24 right-0 sm:relative sm:top-0 sm:right-0 flex gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><Share2 className="w-5 h-5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent sideOffset={8} align="end">
                    {shareOptions.map(({ label, icon, url }) => (
                      <DropdownMenuItem key={label} className="flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" onClick={() => window.open(url, '_blank')}>
                        {icon}
                        <span>{label}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" onClick={() => { if (navigator.share) { navigator.share({ title: 'Check my profile', url: window.location.href, }); } }}>
                      <Share2 className="w-4 h-4" />
                      Native Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" onClick={handleDownload} disabled={isDownloading}>
                  {isDownloading ? (<motion.div className="animate-spin" key="loader" initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 className="h-5 w-5" /></motion.div>) : (<Download className="h-5 w-5" key="download" />)}
                </Button>
              </motion.div>
            </div>

            {(profile.verifiedAccounts?.length > 0 || profile.settings?.privateMessagesEnabled) && (
              <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                {profile.verifiedAccounts.map((acc) => {
                  const Icon = iconMap[acc.provider.toLowerCase()];
                  return Icon ? (
                    <a key={acc.provider} href={acc.profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 hover:bg-black/10 rounded-full transition-colors">
                      <Icon className="h-5 w-5" />
                    </a>
                  ) : null;
                })}
                {profile.settings?.privateMessagesEnabled && <a href={'mailto:' + profile.email} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 hover:bg-black/10 rounded-full transition-colors"><Mail className="h-5 w-5" /></a>}
              </div>
            )}

            <div className="mt-8 space-y-6">
              {sectionOrder.map((key) => {
                const component = sectionComponents[key];
                return visibility[key] && component ? (<div key={key}>{component}</div>) : null;
              })}
            </div>

            <div className="mt-12 flex justify-center">
              <AdvancedDetailsDialog profile={profile} />
            </div>

            {!profile.isProUser && (
              <footer className="mt-16 py-8 border-t flex md:flex-row flex-col w-full justify-center md:justify-between text-sm md:gap-0 gap-5 items-center">
                <Link href="/" className="-m-1.5 p-1.5 flex items-center justify-center space-x-2"><Image src="/logotext.svg" alt="WhatsYour.Info" width={160} height={28} /></Link>
                <div className="flex justify-center md:items-center gap-4">
                  <Link href="/terms" className="hover:underline">Terms</Link>
                  <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                </div>
                <Link href="/register"><Button style={accentButtonStyle}>Create Your Profile</Button></Link>
              </footer>
            )}
          </div>
        </div>
      </div>
      {modalOpen && (<GalleryModal images={profile.gallery} initialIndex={selectedImageIndex} onClose={() => setModalOpen(false)} />)}
    </>
  );
}

// --- THIS IS NOW THE MAIN EXPORTED COMPONENT ---
export default function PublicProfileView({ profile, isPreview = false }: { profile: UserProfile; isPreview?: boolean; }) {
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isProfilePrivate = profile.profileVisibility === 'private';

  useEffect(() => {
    // We only need to check ownership for a live private profile.
    if (isProfilePrivate && !isPreview) {
      const checkOwnership = async () => {
        setIsLoading(true);
        try {
          const res = await fetch('/api/oauth/user');
          if (res.ok) {
            const loggedInUser = await res.json();
            setIsOwner(loggedInUser._id === profile._id);
          } else {
            setIsOwner(false);
          }
        } catch (error) {
          console.error("Failed to fetch auth status:", error);
          setIsOwner(false);
        } finally {
          setIsLoading(false);
        }
      };
      checkOwnership();
    } else {
      // For public profiles or any preview, we don't need to load anything.
      setIsLoading(false);
    }
  }, [profile._id, isProfilePrivate, isPreview]); // Depend on stable values

  // --- REFACTORED RENDER LOGIC ---
  // This logic is now inside the main return, ensuring hooks are always called.

  // Case 1: Live private profile, still checking permission.
  if (isProfilePrivate && !isPreview && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
        <p className="mt-4 text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  // Case 2: Live private profile, viewer is NOT the owner.
  if (isProfilePrivate && !isPreview && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
        <Lock className="h-12 w-12 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">This Profile is Private</h1>
        <p className="text-gray-600 mt-2">The user has chosen to keep their profile information private.</p>
      </div>
    );
  }

  // Case 3: Public profile, or a preview, or the owner of a private profile.
  // In all these cases, we show the full profile content.
  return <ProfileContent profile={profile} isPreview={isPreview} />;
}