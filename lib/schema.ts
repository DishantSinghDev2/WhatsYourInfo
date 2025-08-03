import type {
  Person,
  Organization,
  ProfilePage,
  WithContext
} from "schema-dts";
import { UserProfile } from "@/types";

export function buildProfileJsonLd(profile: UserProfile): WithContext<ProfilePage> {
  const mainEntity: Person | Organization = profile.type === "business"
    ? {
        "@type": "Organization",
        name: profile.businessName ?? `${profile.firstName} ${profile.lastName}`,
        url: `https://whatsyour.info/${profile.username}`,
        description: profile.bio,
       image: `https://whatsyour.info/api/avatars/${profile.username}`,
        sameAs: profile.verifiedAccounts?.map(acc => acc.profileUrl),
        founder: {
          "@type": "Person",
          name: `${profile.firstName} ${profile.lastName}`
        } as Person
      }
    : {
        "@type": "Person",
        name: `${profile.firstName} ${profile.lastName}`,
        url: `https://whatsyour.info/${profile.username}`,
        description: profile.bio,
        image: `https://whatsyour.info/api/avatars/${profile.username}`,
        sameAs: profile.verifiedAccounts?.map(acc => acc.profileUrl),
        jobTitle: profile.isOfficial ? profile.designation : undefined,
        worksFor: (profile.isOfficial && profile.businessName) ? {
          "@type": "Organization",
          name: profile.businessName,
          url: profile.links?.[0]?.url
        } : undefined
      };

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: mainEntity,
  };
}
