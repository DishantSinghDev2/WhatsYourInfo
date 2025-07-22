import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'What\'sYour.Info - Your Unified Digital Identity Platform',
    template: '%s | What\'sYour.Info',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://whatsyour.info',
    siteName: 'What\'sYour.Info',
    title: 'What\'sYour.Info - Your Unified Digital Identity Platform',
    description: 'Create your professional profile, manage your digital identity, and connect with developers worldwide.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'What\'sYour.Info',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What\'sYour.Info - Your Unified Digital Identity Platform',
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
      <body className={`${inter.className} min-h-full bg-gray-50`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}