'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'react-qr-code';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types';
import { Wallet, Loader2, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { SiGithub, SiX, SiLinktree, SiInstagram, SiLinkedin, SiTiktok } from 'react-icons/si';
import { FiRepeat } from 'react-icons/fi';
import ProCrownBadge from '@/components/icon/pro';

const predefinedImages = [
  '/bg-image-1.jpg',
  '/bg-image-2.jpg',
  '/bg-image-3.jpeg',
  '/bg-image-4.jpg',
];

const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'github': return <SiGithub className="text-gray-800" />;
    case 'twitter': return <SiX className="text-blue-500" />;
    case 'instagram': return <SiInstagram className="text-pink-500" />;
    case 'linkedin': return <SiLinkedin className="text-blue-700" />;
    case 'tiktok': return <SiTiktok className="text-black" />;
    case 'linktree': return <SiLinktree className="text-green-600" />;
    default: return <SiLinktree className="text-gray-600" />;
  }
};

export default function DigitalBusinessCard({ user }: { user: UserProfile }) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const profileUrl = `https://whatsyour.info/${user.username}`;

  const handleDownload = async () => {
    setIsDownloading(true);

    const backElement = backRef.current;
    const originalTransform = backElement ? backElement.style.transform : '';

    // Temporarily remove the transform from the back element to capture it correctly
    if (backElement) {
      backElement.style.transform = 'none';
    }

    try {
      if (user.isProUser) {
        if (!frontRef.current || !backElement) return;

        const zip = new JSZip();

        // Use Promise.all to generate images concurrently
        const [frontDataUrl, backDataUrl] = await Promise.all([
          toPng(frontRef.current, { cacheBust: true, pixelRatio: 2 }),
          toPng(backElement, { cacheBust: true, pixelRatio: 2 })
        ]);

        zip.file('card-front.png', frontDataUrl.split(',')[1], { base64: true });
        zip.file('card-back.png', backDataUrl.split(',')[1], { base64: true });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'digital-business-card.zip');
      } else {
        if (!frontRef.current) return;
        const dataUrl = await toPng(frontRef.current, { cacheBust: true, pixelRatio: 2 });
        saveAs(dataUrl, 'digital-business-card.png');
      }
    } catch (error) {
      console.error("Failed to download card:", error);
      // Optionally, add user-facing error feedback here
    } finally {
      // IMPORTANT: Restore the transform so the UI animation remains correct
      if (backElement) {
        backElement.style.transform = originalTransform;
      }
      setIsDownloading(false);
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBgImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Digital Business Card</h2>

      <div className="flex justify-center">
        <div className="relative w-96 h-56" style={{ perspective: '1200px' }}>
          <motion.div
            className="relative w-full h-full"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Front of the Card */}
            <div
              ref={frontRef}
              className="absolute w-full h-full rounded-lg shadow-md overflow-hidden p-4 flex flex-col justify-between"
              style={{
                backgroundColor: bgColor,
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: textColor,
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="z-10">
                <h3 className="text-xl font-bold">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm opacity-80">
                  {!user.isProUser ? `whatsyour.info/${user.username}` : user.customDomain || `whatsyour.info/${user.username}`}
                </p>
              </div>
              <div className="z-10 flex items-end justify-between">
                <img
                  src={`/api/avatars/${user.username}`}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-14 h-14 rounded-full border-2"
                  style={{ borderColor: textColor }}
                />
                <div className="bg-white p-1 rounded-md">
                  <QRCode value={profileUrl} size={56} />
                </div>
              </div>
              {bgImage && <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg z-0" />}
            </div>

            {/* Back of the Card (for Pro Users) */}
            {user.isProUser && (
              <div
                ref={backRef}
                className="absolute w-full h-full rounded-lg shadow-md overflow-hidden p-4 flex flex-col justify-between"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div>
                  <h4 className="text-lg font-semibold mb-1">About</h4>
                  <p className="text-sm mb-2 line-clamp-4">{user.bio || 'No bio provided.'}</p>
                  {user.verifiedAccounts?.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium">Verified Accounts</h5>
                      <ul className="text-sm space-y-1 mt-1">
                        {user.verifiedAccounts.map((acc) => (
                          <li key={acc.providerAccountId} className="flex items-center gap-2">
                            {getProviderIcon(acc.provider)}
                            <a href={acc.profileUrl} className="hover:underline text-blue-500" target="_blank" rel="noreferrer">
                              @{acc.username}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {user.wallet && user.wallet?.length > 0 && user.showWalletOnPublic && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium">Wallets</h5>
                      <ul className="text-sm space-y-1">
                        {user.wallet.map((w) => (
                          <li key={w.id} className="flex items-center gap-2">
                            <Wallet size={16} /> {w.paymentType.toUpperCase()}: {w.address}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {user.isProUser && (
            <button
              onClick={() => setIsFlipped((prev) => !prev)}
              className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm rounded-full p-1 z-20 hover:bg-white transition"
              aria-label="Flip card"
            >
              <FiRepeat size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <label className="flex items-center gap-2">
            Background Color:
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8" />
          </label>
          <label className="flex items-center gap-2">
            Text Color:
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8" />
          </label>
        </div>

        <div>
          <p className="text-sm mb-2 text-gray-600 font-medium">Choose a Background Image:</p>
          <div className="flex gap-3 flex-wrap">
            {predefinedImages.map((img) => (
              <img
                key={img}
                src={img}
                alt="Card background option"
                className={cn(
                  'h-20 w-36 rounded-md object-cover border cursor-pointer hover:scale-105 transition-transform',
                  bgImage === img && 'ring-2 ring-blue-500'
                )}
                onClick={() => setBgImage(img)}
              />
            ))}
          </div>
        </div>

        {user.isProUser && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Upload Your Own Background <ProCrownBadge className='ml-1 inline'/></p>
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomImageUpload}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            user.isProUser ? 'Download Card (ZIP)' : 'Download Front (PNG)'
          )}
        </Button>
      </div>
    </div>
  );
}