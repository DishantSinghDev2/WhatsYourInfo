import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
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
        "@type":
          profile.type === "business"
            ? "Organization"
            : "Person",
        "name":
          profile.type === "business"
            ? profile.businessName || `${profile.firstName} ${profile.lastName}`
            : `${profile.firstName} ${profile.lastName}`,
        "url": `https://whatsyour.info/${profile.username}`,
        "description": profile.bio?.replace(/\s+/g, ' ').trim().slice(0, 160) || undefined,
        "image": `https://whatsyour.info/api/avatars/${profile.username}`,
        ...(profile.verifiedAccounts?.length > 0 && {
          sameAs: profile.verifiedAccounts.map((account) => account.profileUrl),
        }),
        ...(profile.isOfficial &&
          profile.type !== "business" && {
          jobTitle: profile.designation || undefined,
        }),
        ...(profile.firstName && profile.lastName &&
          (profile.type === "business" || profile.type === "official") && {
          founder: {
            "@type": "Person",
            "name": `${profile.firstName} ${profile.lastName}`,
          },
        }),
      })}
    </script>

    <body className="m-0 p-0">
      <PublicProfileView profile={profile} />;
    </body>
  </>
}
