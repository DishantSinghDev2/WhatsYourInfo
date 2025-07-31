'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Globe, Star, CheckCircle, Clock } from 'lucide-react';
import { UserProfile } from '@/types';
import tinycolor from 'tinycolor2';

export function AdvancedDetailsDialog({ profile }: { profile: UserProfile }) {
  const colors = profile.design?.customColors || {};

  const isGradient = (val: string) => val?.startsWith('linear-gradient');

  // Handle background
  const bg = colors.background || '#ffffff';
  const bgStyle = isGradient(bg)
    ? { backgroundImage: bg }
    : { backgroundColor: bg };

  // Determine text color against solid background
  const textColor = isGradient(bg)
    ? 'text-white'
    : tinycolor(bg).isDark() ? 'text-white' : 'text-black';

  // Handle surface
  const surface = colors.surface || '#f3f4f6';
  const surfaceStyle = isGradient(surface)
    ? { backgroundImage: surface }
    : { backgroundColor: surface };
  const surfaceText = isGradient(surface)
    ? 'text-white'
    : tinycolor(surface).isDark() ? 'text-white' : 'text-black';

  // Accent button styling
  const accent = colors.accent || '#111827';
  const accentBtnStyle = isGradient(accent)
    ? {
      backgroundImage: accent,
      color: 'white',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    }
    : {
      backgroundColor: accent,
      color: tinycolor(accent).isDark() ? 'white' : 'black'
    };

  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',  // e.g., "Thursday"
    year: 'numeric',
    month: 'long',    // e.g., "July"
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    const intervals: [number, Intl.RelativeTimeFormatUnit][] = [
      [60, 'second'],
      [60, 'minute'],
      [24, 'hour'],
      [30, 'day'],
      [12, 'month'],
      [Number.POSITIVE_INFINITY, 'year'],
    ];

    let duration = seconds;
    let unit: Intl.RelativeTimeFormatUnit = 'second';

    for (const [divisor, nextUnit] of intervals) {
      if (duration < divisor) break;
      duration = Math.floor(duration / divisor);
      unit = nextUnit;
    }

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    return rtf.format(-duration, unit);
  }


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" style={accentBtnStyle}>
          Advanced details
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 shadow-xl rounded-xl">
        <div className={`grid md:grid-cols-2 ${textColor}`} style={bgStyle}>
          {/* Left Panel */}
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold mb-2">Profile Details</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-4">
              <img
                src={`${process.env.NEXT_PUBLIC_APP_URL}/api/avatars/${profile.username}?t=${Date.now()}`}
                className="w-16 h-16 rounded-full object-cover border"
                alt={`${profile.firstName}'s avatar`}
              />
              <div>
                <p className="font-semibold text-lg">
                  {profile.firstName} {profile.lastName}
                </p>
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL}/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline underline-offset-2"
                  style={{ color: tinycolor(accent).toHexString() }}
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
  Updated: {timeAgo(new Date(profile.updatedAt))}
</p>

              <p className="flex items-center gap-2">
                <Star className="w-4 h-4 opacity-70" />
                Created: {formatter.format(new Date(profile.createdAt))}
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

          {/* Right Panel */}
          <div
            className={`p-6 flex flex-col gap-3 text-sm ${surfaceText}`}
            style={surfaceStyle}
          >
            <p className="font-semibold">Quick Links</p>
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL}/${profile.username}.card`}
              className="hover:underline text-blue-400"
              target="_blank"
            >
              whatsyour.info/{profile.username}.card
            </a>

            <div className="flex flex-col gap-2 mt-3">
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL}/api/vcard/${profile.username}`}
                download
                className="text-blue-400 hover:underline"
              >
                Download vCard
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL}/qr/${profile.username}?type=logo`}
                target='_blank'
                className="text-blue-400 hover:underline"
              >
                QR - Logo
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL}/qr/${profile.username}?type=avatar`}
                target='_blank'
                className="text-blue-400 hover:underline"
              >
                QR - Avatar
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
