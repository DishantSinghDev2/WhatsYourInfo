import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BadgeCheck } from 'lucide-react';
import { User } from '@/lib/auth';

// Assuming User type is updated to include verifiedAccounts
// a good structure would be: `verifiedAccounts: { service: string, url: string }[]`
interface VerifiedAccountsSectionProps {
  verifiedAccounts?: User['verifiedAccounts']; 
}

export default function VerifiedAccountsSection({ verifiedAccounts }: VerifiedAccountsSectionProps) {
  if (!verifiedAccounts || verifiedAccounts.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Verified Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {verifiedAccounts.map((account, index) => (
          <a
            key={index}
            href={account.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-800 hover:text-blue-600 transition-colors"
          >
            <BadgeCheck className="h-5 w-5 text-blue-500 mr-3" />
            <span className="font-medium">{account.service}</span>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}