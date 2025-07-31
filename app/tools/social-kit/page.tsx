// app/tools/social-kit/page.tsx

'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import Image from 'next/image';

export default function SocialKitPage() {
    const twitterHeaderUrl = `/api/tools/social-kit/twitter-header?t=${new Date().getTime()}`;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Social Media Kit</h1>
                    <p className="text-gray-600 mt-2">Download branded assets for your social media profiles, generated with your info.</p>
                </div>
                
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold mb-3">Twitter / X Header</h2>
                        <div className="border rounded-lg p-4 bg-white">
                           <Image src={twitterHeaderUrl} alt="Generated Twitter Header" width={1500} height={500} className="w-full rounded-md shadow-md"/>
                           <Button asChild className="mt-4">
                               <a href={twitterHeaderUrl} download="twitter-header.png">
                                   <Download className="h-4 w-4 mr-2"/> Download
                               </a>
                           </Button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}