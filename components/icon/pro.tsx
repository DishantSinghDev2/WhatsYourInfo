'use client';

import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

export default function ProCrownBadge({ size = 48 }: { size?: number }) {
  return (
    <div title='PRO'>
        <Crown className='fill-yellow-400 text-yellow-400 w-4' />
    </div>
  );
}
