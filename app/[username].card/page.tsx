// app/[username].card/page.tsx

import { notFound } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import WebCardView from '@/components/WebCardView';
import { UserProfile } from '@/types'; // Make sure your UserProfile type is correctly imported

/**
 * Server-side function to fetch only the necessary public profile data.
 * Using a projection is crucial for security and performance.
 */
async function getPublicProfile(username: string): Promise<UserProfile | null> {
  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const user = await db.collection('users').findOne(
      { username: username.toLowerCase() },
      {
        // Projection: Explicitly list ONLY the fields needed for the public card.
        projection: {
          username: 1,
          firstName: 1,
          lastName: 1,
          bio: 1,
          verifiedAccounts: 1,
          links: 1,
          design: 1,
          // CRITICAL: NEVER include sensitive fields like email, password, tokens, etc.
        }
      }
    );

    if (!user) {
      return null;
    }

    // Convert MongoDB ObjectId to string for client component serialization
    return { ...user, _id: user._id.toString() } as UserProfile;

  } catch (error) {
    console.error("Failed to fetch profile for web card:", error);
    return null;
  }
}

export default async function WebCardPage({ params }: { params: { username: string } }) {
  const userProfile = await getPublicProfile(params.username);

  // If no user is found, render the standard 404 page.
  if (!userProfile) {
    notFound();
  }

  // Pass the secure, public data to the client component for rendering.
  return <WebCardView profile={userProfile} />;
}