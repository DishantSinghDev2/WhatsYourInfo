import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Globe, Twitter, Linkedin, Github } from 'lucide-react';
import { User } from '@/lib/auth';

interface LinksSectionProps {
  socialLinks: User['socialLinks'];
}

const socialIcons = {
  website: <Globe className="h-4 w-4 mr-2" />,
  twitter: <Twitter className="h-4 w-4 mr-2" />,
  linkedin: <Linkedin className="h-4 w-4 mr-2" />,
  github: <Github className="h-4 w-4 mr-2" />,
};

export default function LinksSection({ socialLinks }: LinksSectionProps) {
  const availableLinks = Object.entries(socialLinks).filter(([, url]) => url);

  if (availableLinks.length === 0) {
    return null; // Don't render the card if there are no links
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {availableLinks.map(([key, url]) => (
            <Button key={key} variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                {socialIcons[key as keyof typeof socialIcons]}
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}