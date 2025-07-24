import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import clientPromise from '@/lib/mongodb';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Globe,
  Mail,
  Twitter,
  Linkedin,
  Github,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: string;
  email: string;
  isProUser: boolean;
  customDomain?: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  spotlightButton?: {
    text: string;
    url: string;
    color: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

async function getProfile(username: string): Promise<User | null> {
  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    
    const user = await db.collection('users').findOne(
      { username },
      {
        projection: {
          password: 0, // Never include password
        }
      }
    );

    if (!user) return null;

    return {
      ...user,
      _id: user._id.toString(),
    } as User;
  } catch (error) {
    console.error('Profile fetch error:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const profile = await getProfile(params.username);

  if (!profile) {
    return {
      title: 'Profile Not Found | What\'sYour.Info',
      description: 'The requested profile could not be found.',
    };
  }

  const title = `${profile.firstName} ${profile.lastName} | What'sYour.Info`;
  const description = profile.bio || 
    `Professional profile of ${profile.firstName} ${profile.lastName} on What'sYour.Info`;
  const canonicalUrl = `https://whatsyour.info/${profile.username}`;
  const avatar = `https://whatsyour.info/api/avatars/${profile.username}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: avatar,
          width: 400,
          height: 400,
          alt: `${profile.firstName} ${profile.lastName}`,
        },
      ],
      siteName: 'What\'sYour.Info',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [avatar],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getProfile(params.username);

  if (!profile) {
    notFound();
  }

  const avatar = `/api/avatars/${profile.username}`;
  const joinedDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Analytics Tracking */}
      <Script id="profile-analytics" strategy="afterInteractive">
        {`
          fetch('/api/analytics/profile-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: '${profile.username}',
              referrer: document.referrer,
              userAgent: navigator.userAgent
            })
          }).catch(() => {});
        `}
      </Script>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: `${profile.firstName} ${profile.lastName}`,
            url: `https://whatsyour.info/${profile.username}`,
            image: avatar,
            description: profile.bio,
            sameAs: Object.values(profile.socialLinks).filter(Boolean),
          }),
        }}
      />

      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Profile Header */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
              <div className="relative -mt-16 mb-4 sm:mb-0">
                <img
                  src={avatar}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="h-32 w-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="text-lg text-gray-600">@{profile.username}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined {joinedDate}
                    </div>
                  </div>
                  {profile.isProUser && profile.spotlightButton && (
                    <div className="mt-4 sm:mt-0">
                      <Link
                        href={profile.spotlightButton.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="lg"
                          className="w-full sm:w-auto"
                          style={{ backgroundColor: profile.spotlightButton.color }}
                        >
                          {profile.spotlightButton.text}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead Capture Form for Pro Users */}
            {profile.isProUser && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h3>
                  <form className="space-y-4" onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    
                    try {
                      const response = await fetch('/api/leads/capture', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          username: profile.username,
                          name: formData.get('name'),
                          email: formData.get('email'),
                          message: formData.get('message'),
                          source: 'profile'
                        })
                      });
                      
                      if (response.ok) {
                        alert('Message sent successfully!');
                        (e.target as HTMLFormElement).reset();
                      } else {
                        alert('Failed to send message. Please try again.');
                      }
                    } catch {
                      alert('Failed to send message. Please try again.');
                    }
                  }}>
                    <div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Your Email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <textarea
                        name="message"
                        placeholder="Your Message"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Section */}
            {profile.bio && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Contact Section */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in touch</h2>
                <p className="text-gray-600 mb-4">
                  Connect with {profile.firstName} on their preferred platforms
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:hello@${profile.username}.whatsyour.info`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </a>
                  </Button>
                  {profile.socialLinks.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={profile.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={profile.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks.github && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={profile.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile URLs */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile URLs</h3>
                <div className="space-y-3 text-sm">
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
                </div>
              </CardContent>
            </Card>

            {/* What's Your Info Branding */}
            {!profile.isProUser && (
              <Card className="border-0 shadow-md bg-blue-50">
                <CardContent className="p-6 text-center">
                  <Globe className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-700 mb-3">
                    This profile is powered by What'sYour.Info
                  </p>
                  <Link href="/register">
                    <Button size="sm" className="w-full">
                      Create Your Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Gallery for Pro Users */}
        {profile.isProUser && (
          <Card className="mt-8 border-0 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Gallery items would be loaded from API */}
                <div className="text-center py-8 col-span-full">
                  <p className="text-gray-500">Gallery feature coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}