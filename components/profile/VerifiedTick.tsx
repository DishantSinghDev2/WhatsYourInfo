'use client';

import { UserProfile } from '@/types';
import { BadgeCheck, Building2 } from 'lucide-react';

export default function VerifiedTick({ profile }: { profile: UserProfile | undefined }) {
  
  // =================================================================
  // THIS IS YOUR SUGGESTED FIX, IMPLEMENTED IN THE SOURCE CODE
  // =================================================================
  // If the profile object is undefined for any reason during a render,
  // we stop right here and render nothing, preventing the crash.

  console.log('profile', profile)
  if (!profile) {
    return null;
  }
  // =================================================================

  // Because of the guard clause above, it is now 100% safe
  // to destructure the 'profile' object.
  const { type, isProUser, isOfficial, emailVerified } = profile;

  // --- The rest of your component logic remains exactly the same ---

  if (type === 'official' || isOfficial) {
    const officialColor = isProUser ? 'text-yellow-500' : 'text-blue-500';
    const officialFill = isProUser ? '#FBBF24' : '#3B82F6';

    return (
      <div title="Official Account">
        <BadgeCheck
          className={`h-5 w-5 ${officialColor}`}
          fill={officialFill}
        />
      </div>
    );
  }

  if (type === 'business') {
    return (
      <div title="Business Account">
        <Building2 className="h-5 w-5 text-gray-700" />
      </div>
    );
  }

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