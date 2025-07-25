import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Globe } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/lib/auth'; // Assuming User type is in /lib/auth

interface ProfileSidebarProps {
  profile: Pick<User, 'username' | 'customDomain' | 'isProUser'>;
}

export default function ProfileSidebar({ profile }: ProfileSidebarProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Profile URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-gray-600">Primary URL:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs break-all">
              https://whatsyour.info/{profile.username}
            </code>
          </div>
          <div>
            <p className="text-gray-600">Subdomain URL:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs break-all">
              https://{profile.username}.whatsyour.info
            </code>
          </div>
          {profile.customDomain && (
            <div>
              <p className="text-gray-600">Custom Domain:</p>
              <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                https://{profile.customDomain}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {!profile.isProUser && (
        <Card className="border-0 shadow-md bg-blue-50">
          <CardContent className="p-6 text-center">
            <Globe className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-700 mb-3">
              This profile is powered by What'sYour.Info
            </p>
            <Button size="sm" className="w-full" asChild>
              <Link href="/register">Create Your Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}