'use client';

import { UserProfile } from '@/types';
import { BadgeCheck, Building2 } from 'lucide-react';

export default function VerifiedTick({ profile }: { profile: UserProfile | undefined }) {
  
  // Guard clause to prevent crashes if profile is undefined
  if (!profile) {
    return null;
  }

  const { type, isProUser, isOfficial, emailVerified } = profile;

  // --- THIS IS THE SECTION WITH THE CHANGE ---
  if (type === 'official' || isOfficial) {
    // Determine the solid fill color based on Pro status
    const officialFillColor = isProUser ? '#FBBF24' : '#3B82F6';

    return (
      <div title="Official Account">
        <BadgeCheck
          // Set the outline (stroke) of the icon to be transparent
          className="h-5 w-5 text-transparent"
          // Fill the entire shape with the desired color
          fill={officialFillColor}
        />
      </div>
    );
  }

  // Business accounts logic remains the same
  if (type === 'business') {
    return (
      <div title="Business Account">
        <Building2 className="h-5 w-5 text-gray-700" />
      </div>
    );
  }

  // Standard email verification logic remains the same
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