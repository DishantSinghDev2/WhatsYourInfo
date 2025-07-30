// Imports remain largely the same, but add new components
import { notFound } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import { Metadata } from 'next';
import PublicProfileView from '@/components/profile/PublicProfileView';
import { UserProfile } from '@/types';


async function getProfile(username: string): Promise<UserProfile | null> {
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
    } as UserProfile;
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
  if (!profile) notFound();

  // The entire page is now just this one line.
  return <PublicProfileView profile={profile} />;
}