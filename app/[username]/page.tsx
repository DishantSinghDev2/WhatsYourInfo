import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import PublicProfileView from "@/components/profile/PublicProfileView";
import type { Metadata } from "next";
import type { UserProfile } from "@/types";
import redis from "@/lib/redis";
import { cacheGet } from "@/lib/cache";
import Script from "next/script";

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


  const title = `${profile.firstName} ${profile.lastName} ${profile.designation && profile.type === 'official' ? `| ${profile.designation}` : ''} ${profile.type === 'business' ? '| Business Profile' : ''}`;
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": profile.type === "business" ? "Organization" : "Person",
    name: profile.type === "business"
      ? profile.businessName || `${profile.firstName} ${profile.lastName}`
      : `${profile.firstName} ${profile.lastName}`,
    url: `https://whatsyour.info/${profile.username}`,
    description: profile.bio?.replace(/\s+/g, ' ').trim().slice(0, 160) || undefined,
    image: `https://whatsyour.info/api/avatars/${profile.username}`,
    ...(profile.verifiedAccounts?.length > 0 && {
      sameAs: profile.verifiedAccounts.map((account) => account.profileUrl),
    }),
    ...(profile.isOfficial && profile.type !== "business" && {
      jobTitle: profile.designation || undefined,
    }),
    ...(profile.firstName && profile.lastName &&
      profile.type === "business" && {
      founder: {
        "@type": "Person",
        name: `${profile.firstName} ${profile.lastName}`,
      },
    }),
  };

  const safeJson = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return <>
    <section>
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
          __html: JSON.stringify(jsonLd),
        }}
      />

      <PublicProfileView profile={profile} />
    </section>
  </>
}
