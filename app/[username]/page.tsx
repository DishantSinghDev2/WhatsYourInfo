import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { headers } from "next/headers";
import PublicProfileView from "@/components/profile/PublicProfileView";
import type { Metadata } from "next";
import type { UserProfile } from "@/types";

async function getProfile(username: string): Promise<UserProfile | null> {
  try {
    const client = await clientPromise;
    const db = client.db("whatsyourinfo");
    const user = await db.collection("users").findOne(
      { username },
      { projection: { password: 0 } }
    );
    if (!user) return null;

    return {
      ...user,
      _id: user._id.toString(),
    } as UserProfile;
  } catch (error) {
    console.error("Profile fetch error:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const { username } = params;
  const profile = await getProfile(username);

  if (!profile) {
    return {
      title: "Profile Not Found | What'sYour.Info",
      description: "The requested profile could not be found.",
    };
  }

  const title = `${profile.firstName} ${profile.lastName} | What'sYour.Info`;
  const description =
    profile.bio || `Professional profile of ${profile.firstName} ${profile.lastName} on What'sYour.Info`;
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
          url: `https://whatsyour.info/api/avatars/${profile.username}`,
          width: 400,
          height: 400,
          alt: `${profile.firstName} ${profile.lastName}`,
        },
      ],
      siteName: "What'sYour.Info",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [`https://whatsyour.info/api/avatars/${profile.username}`],
    },
    robots: {
      index: profile.isProUser ? true : false,
      follow: profile.isProUser ? true : false,
    },
  };
}

// ✅ Use caching inside server component
export const revalidate = 300; // ISR-style cache for 5 minutes

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const profile = await getProfile(username);

  if (!profile) notFound();

  return <>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": {
          "@type": "Person",
          "name": `${profile.firstName} ${profile.lastName}`,
          "url": `https://whatsyour.info/${profile.username}`,
          "sameAs": profile.verifiedAccounts.some(a => a.profileUrl) || [],
          "description": profile.bio,
          "image": `https://whatsyour.info/api/avatars/${profile.username}`
        }
      })}
    </script>

<body>
  
    <PublicProfileView profile={profile} />;
</body>
  </>
}
