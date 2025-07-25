// Imports remain largely the same, but add new components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import AboutSection from '@/components/profile/AboutSection';
import LinksSection from '@/components/profile/LinksSection';
import VerifiedAccountsSection from '@/components/profile/VerifiedAccountsSection';
import GallerySection from '@/components/profile/GallerySection'; // For Pro users
import LeadCaptureSection from '@/components/profile/LeadCaptureSection'; // For Pro users
import { notFound } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import { Metadata } from 'next';
import { User } from '@/lib/auth'; // Assuming you move the User interface to a shared location

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

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Analytics and JSON-LD Scripts remain the same */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ProfileHeader profile={profile} />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <AboutSection bio={profile.bio} />
            <LinksSection socialLinks={profile.socialLinks} />
            <VerifiedAccountsSection verifiedAccounts={profile.verifiedAccounts} />
            {profile.isProUser && <GallerySection username={profile.username} />}
          </div>
          <div className="space-y-8">
            <ProfileSidebar profile={profile} />
            {profile.isProUser && <LeadCaptureSection username={profile.username} />}
          </div>
        </div>
      </div>
    </div>
  );
}