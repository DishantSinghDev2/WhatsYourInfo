import { BadgeCheck } from 'lucide-react';

export default function VerifiedTick({ isPro }: { isPro: boolean }) {
  if (isPro) {
    return <BadgeCheck className="h-5 w-5 text-yellow-500" />;
  }
  return <BadgeCheck className="h-5 w-5 text-blue-500" />;
}