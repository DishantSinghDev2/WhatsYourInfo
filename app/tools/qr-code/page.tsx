// app/tools/qr-code/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Download, Link as LinkIcon } from 'lucide-react';
import { User } from '@/lib/auth';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function QrCodeGeneratorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [qrType, setQrType] = useState<'logo' | 'avatar'>('logo');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (res.ok) setUser((await res.json()).user);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (isLoading || !user) {
    return <div>Loading...</div>; // Add a proper loading state
  }

  const qrCodeUrl = `/qr/${user.username}?type=${qrType}&t=${new Date().getTime()}`;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `whatsyourinfo-${user.username}-qrcode.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR Code download started!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
          <p className="text-gray-600 mt-2">Create a scannable QR code for your digital business card.</p>
        </div>

        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* QR Code Preview */}
            <div className="flex flex-col items-center justify-center bg-gray-100 p-8 rounded-lg">
              <Image 
                key={qrCodeUrl} // Force re-render when URL changes
                src={qrCodeUrl}
                alt="Your Profile QR Code"
                width={256}
                height={256}
                className="rounded-lg shadow-md border"
              />
              <p className="text-xs text-gray-500 mt-4 text-center">
                Scan this code to go to:<br/>
                <span className="font-mono text-blue-600">whatsyour.info/{user.username}</span>
              </p>
            </div>

            {/* Customization Options */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Center Image Style</h3>
                <div className="flex gap-2">
                  <Button variant={qrType === 'logo' ? 'default' : 'outline'} onClick={() => setQrType('logo')}>Platform Logo</Button>
                  <Button variant={qrType === 'avatar' ? 'default' : 'outline'} onClick={() => setQrType('avatar')}>Your Avatar</Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Choose what image appears in the middle of your QR code.</p>
              </div>
              
              <div className="border-t pt-6">
                <Button onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-2"/>
                  Download QR Code (.png)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}