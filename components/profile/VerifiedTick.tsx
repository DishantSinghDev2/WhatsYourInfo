'use client';

import { UserProfile } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';

export default function VerifiedTick({ profile }: { profile: UserProfile | undefined }) {
  if (!profile) return null;

  const { type, isProUser, isOfficial, emailVerified } = profile;

  let badgeSrc = '';
  let tooltipText = '';

  // -- Official account (internal team/staff) --
  if (type === 'official' && isOfficial) {
    badgeSrc = isProUser
      ? '/badges/official-pro.webp'
      : '/badges/official-free.webp';
    tooltipText = isProUser
      ? 'This profile belongs to a Pro member of the WhatsYour.Info official team.'
      : 'This profile belongs to an official WhatsYour.Info team member.';
  }

  // -- Business account (free/pro/official) --
  else if (type === 'business') {
    badgeSrc = isOfficial
      ? '/badges/business-off.webp'
      : isProUser
        ? '/badges/business-pro.webp'
        : '/badges/business-free.webp';

    tooltipText = isOfficial
      ? 'This is an officially verified business on WhatsYour.Info.'
      : isProUser
        ? 'This is a business profile with a Pro plan.'
        : 'This is a business profile on a Free plan.';
  }

  // -- Personal users (email verified) --
  else if (emailVerified) {
    badgeSrc = isProUser
      ? '/badges/personal-pro.webp'
      : '/badges/personal-free.webp';

    tooltipText = isProUser
      ? 'This is a personal profile with a Pro subscription.'
      : 'This is a verified personal profile on a Free plan.';
  } else {
    return null;
  }

  // -- Render badge --
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Image
            src={badgeSrc}
            alt="User badge"
            width={20}
            height={20}
            className="inline-block h-5 w-5 cursor-pointer"
          />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-sm">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
