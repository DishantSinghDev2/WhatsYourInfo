'use client';

import { Crown } from 'lucide-react';

export default function ProCrownBadge({ size = 48, className }: { size?: number, className?: string }) {
  return (
    <Crown size={size} className={`${className} fill-yellow-400 text-yellow-400 w-5 h-5`} aria-label='PRO' />
  );
}
