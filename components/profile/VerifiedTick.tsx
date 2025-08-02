'use client';

import { UserProfile } from '@/types';
import { BadgeCheck, Building2 } from 'lucide-react';

export default function VerifiedTick({ profile }: { profile: UserProfile }) {
  const { type, isProUser, isOfficial, emailVerified } = profile;

  // Official accounts get a filled badge
  if (type === 'official' || isOfficial) {
    const officialColor = isProUser ? 'text-yellow-500' : 'text-blue-500';
    const officialFill = isProUser ? '#FBBF24' : '#3B82F6'; // Hex for yellow-500 and blue-500

    return (
      <div title="Official Account">
        <BadgeCheck
          className={`h-5 w-5 ${officialColor}`}
          fill={officialFill}
        />
      </div>
    );
  }

  // Business accounts get a building icon
  if (type === 'business') {
    return (
      <div title="Business Account">
        <Building2 className="h-5 w-5 text-gray-700" />
      </div>
    );
  }

  // Standard email verification for personal accounts
  if (emailVerified) {
    const color = isProUser ? 'text-yellow-500' : 'text-blue-500';
    return (
      <div title="Verified Email">
        <BadgeCheck className={`h-5 w-5 ${color}`} />
      </div>
    );
  }

  return null;
}