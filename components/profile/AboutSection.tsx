import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface AboutSectionProps {
  bio?: string;
}

export default function AboutSection({ bio }: AboutSectionProps) {
  if (!bio) {
    return null;
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {bio}
        </p>
      </CardContent>
    </Card>
  );
}