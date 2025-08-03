import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import PublicProfileView from "@/components/profile/PublicProfileView";
import type { Metadata } from "next";
import type { UserProfile } from "@/types";
import StructuredData from "./StructuredData";
import redis from "@/lib/redis";
import { cacheGet } from "@/lib/cache";

async function getProfile(username: string): Promise<UserProfile | null> {
  const cacheKey = `user:profile:${username}`;

  try {
    // Try Redis cache first
    const cached = await cacheGet<UserProfile>(cacheKey);
    if (cached) return cached;

    // Fallback to MongoDB
    const client = await clientPromise;
    const db = client.db("whatsyourinfo");
    const user = await db.collection("users").findOne(
      { username },
      { projection: { password: 0 } }
    ) as UserProfile | null;
    if (!user) return null;

    const profile: UserProfile = {
      ...user,
      _id: user._id.toString()
    };

    // Cache result in Redis for 5 minutes (300s)
    await redis.set(cacheKey, JSON.stringify(profile), {
      EX: 300,
    });

    return profile;
  } catch (error) {
    console.error("getProfile Redis/Mongo Error:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const { username } = params;
  const profile = await getProfile(username);

  if (!profile) {
    return {
      title: "Profile Not Found | WhatsYour.Info",
      description: "The requested profile could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }


  const title = `${profile.firstName} ${profile.lastName} ${profile.designation && profile.type === 'official' ? `| ${profile.designation}` : ''} ${profile.type === 'business' ? '| Business Profile' : ''} | WhatsYour.Info`;
  const description =
    profile.bio || `Professional profile of ${profile.firstName} ${profile.lastName} on WhatsYour.Info`;
  const canonicalUrl = `https://whatsyour.info/${profile.username}`;
  const avatar = `https://whatsyour.info/api/avatars/${profile.username}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "profile",
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
      siteName: "WhatsYour.Info",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [avatar],
    },
    robots: {
      index: profile.isProUser && profile.profileVisibility === 'public',
      follow: profile.isProUser && profile.profileVisibility === 'public',
    },
  };
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const profile = await getProfile(username);

  if (!profile) notFound();

  return <>
    <section>
      {/* Render JSON-LD *before* any hydrated component */}
      <StructuredData profile={profile} />
      <PublicProfileView profile={profile} />
    </section>
  </>
}
