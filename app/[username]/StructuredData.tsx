// app/[username]/StructuredData.tsx
import { UserProfile } from '@/types';

export default function StructuredData({ profile }: { profile: UserProfile }) {
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
      (profile.type === "business") && {
      founder: {
        "@type": "Person",
        name: `${profile.firstName} ${profile.lastName}`,
      },
    }),
  };
  const safeJson = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <script
      id="profile-ld-json"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
