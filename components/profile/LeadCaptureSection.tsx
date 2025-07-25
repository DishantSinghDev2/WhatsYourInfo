import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import LeadCaptureForm from '@/components/LeadCaptureForm'; // Assuming this form component exists

interface LeadCaptureSectionProps {
  username: string;
}

export default function LeadCaptureSection({ username }: LeadCaptureSectionProps) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Get in Touch</CardTitle>
      </CardHeader>
      <CardContent>
        <LeadCaptureForm username={username} />
      </CardContent>
    </Card>
  );
}