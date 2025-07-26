'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types';

const predefinedImages = [
  '/bg-image-1.jpg',
  '/bg-image-2.jpg',
  '/bg-image-3.jpeg',
  '/bg-image-4.jpg',
];

export default function DigitalBusinessCard({ user }: { user: UserProfile }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [bgImage, setBgImage] = useState<string | null>(null);

  const profileUrl = `https://whatsyour.info/${user.username}`;

  const handleDownload = () => {
    if (!cardRef.current) return;
    toPng(cardRef.current, { cacheBust: true }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'digital-card.png';
      link.href = dataUrl;
      link.click();
    });
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
        <div
          ref={cardRef}
          className="w-96 h-56 rounded-lg p-4 shadow-md flex flex-col justify-between relative overflow-hidden transition-all"
          style={{
            backgroundColor: bgColor,
            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: textColor,
          }}
        >
          <div className="z-10">
            <h3 className="text-xl font-bold">{user.firstName} {user.lastName}</h3>
            <p className="text-sm opacity-80">{!user.isProUser ? `whatsyour.info/${user.username}` : user.customDomain || `whatsyour.info/${user.username}`}</p>
          </div>
          <div className="z-10 flex items-end justify-between">
            <img
              src={`/api/avatars/${user.username}`}
              className="w-14 h-14 rounded-full border-2"
              style={{ borderColor: textColor }}
            />
            <div className="bg-white p-1 rounded-md">
              <QRCode value={profileUrl} size={56} />
            </div>
          </div>
          {/* Optional overlay if image is too strong */}
          {bgImage && <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg z-0" />}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <label className="flex items-center gap-2">
            Background Color:
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
          </label>
          <label className="flex items-center gap-2">
            Text Color:
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          </label>
        </div>

        {/* Predefined Backgrounds */}
        <div>
          <p className="text-sm mb-2 text-gray-600 font-medium">Choose a Background Image:</p>
          <div className="flex gap-3 flex-wrap">
            {predefinedImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Card background"
                className={cn(
                  "h-20 w-36 rounded-md object-cover border cursor-pointer hover:scale-105 transition-transform",
                  bgImage === img && 'ring-2 ring-blue-500'
                )}
                onClick={() => setBgImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Custom Upload (Pro Only) */}
        {user.isProUser && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Upload Your Own Background (PRO)</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomImageUpload}
              className="text-sm"
            />
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button size="sm" onClick={handleDownload}>Download Card</Button>
      </div>
    </div>
  );
}
