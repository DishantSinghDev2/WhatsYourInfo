import { UserProfile } from '@/types';
import VerifiedTick from './VerifiedTick';
import { SiGithub, SiX, SiInstagram, SiLinkedin, SiTiktok, SiLinktree } from 'react-icons/si';
import tinycolor from 'tinycolor2';
import { BadgeCheck } from 'lucide-react';

interface Props {
  verifiedAccounts?: UserProfile['verifiedAccounts'];
  design?: UserProfile['design'];
  isPro: boolean;
}

const getProviderIcon = (provider: string, isDark: boolean) => {
  const baseStyle = isDark ? 'text-white' : 'text-gray-800';
  switch (provider.toLowerCase()) {
    case 'github': return <SiGithub className={baseStyle} />;
    case 'twitter': return <SiX className="text-blue-500" />;
    case 'instagram': return <SiInstagram className="text-pink-500" />;
    case 'linkedin': return <SiLinkedin className="text-blue-700" />;
    case 'tiktok': return <SiTiktok className="text-black" />;
    case 'linktree': return <SiLinktree className="text-green-600" />;
    default: return <SiLinktree className={baseStyle} />;
  }
};

export default function VerifiedAccountsSection({ verifiedAccounts, design, isPro }: Props) {
  if (!verifiedAccounts || verifiedAccounts.length === 0) return null;

  const surfaceColor = design?.customColors.surface || '#f4f4f5';
  const isDark = tinycolor(surfaceColor).isDark();

  return (
    <div
      className="rounded-md p-4 bg-black/5 mt-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Verified Accounts</h3>
        <BadgeCheck
          className={`h-5 w-5 ${isPro ? 'text-yellow-500' : 'text-blue-500'}`}
        />
      </div>

      <ul className="space-y-2">
        {verifiedAccounts.map((account) => (
          <li key={account.providerAccountId}>
            <a
              href={account.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 text-sm font-medium transition-colors ${isDark ? 'text-white hover:text-blue-300' : 'text-gray-700 hover:text-blue-600'}`}
            >
              {getProviderIcon(account.provider, isDark)}
              <span className="capitalize">{account.provider}</span>
              <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>@{account.username}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}