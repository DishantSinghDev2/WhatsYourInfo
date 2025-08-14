import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { GoogleAnalytics } from "@next/third-parties/google"
import { ClientDITBlogsProvider } from '@/lib/ditblogs-provider';


const inter = Nunito({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'WhatsYour.Info - Your Unified Digital Identity Platform',
    template: '%s | WhatsYour.Info',
  },
  description: 'Create your professional profile, manage your digital identity, and connect with developers worldwide. Free public profiles with advanced features for Pro users.',
  keywords: ['profile', 'identity', 'digital identity', 'professional profile', 'developer tools', 'API', 'SSO'],
  authors: [{ name: 'DishIs Technologies' }],
  creator: 'DishIs Technologies',
  publisher: 'DishIs Technologies',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://whatsyour.info'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: "/favicon.ico"
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://whatsyour.info',
    siteName: 'What\'sYour.Info',
    title: 'WhatsYour.Info - Your Unified Digital Identity Platform',
    description: 'Create your professional profile, manage your digital identity, and connect with developers worldwide.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WhatsYour.Info',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsYour.Info - Your Unified Digital Identity Platform',
    description: 'Create your professional profile, manage your digital identity, and connect with developers worldwide.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className}`}>

        <ClientDITBlogsProvider>
          {children}
        </ClientDITBlogsProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              color: '#363636',
              background: '#fff',
              border: '1px solid #363636'
            },
          }}
        />
      </body>
      <GoogleAnalytics gaId="G-N7E30Q1QX4" />
    </html>
  );
}