// app/[username]/page.tsx

import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import PublicProfileView from "@/components/profile/PublicProfileView";
import type { Metadata } from "next";
import type { UserProfile } from "@/types";
import redis from "@/lib/redis";
import { cacheGet } from "@/lib/cache";
import Script from "next/script";
import { buildProfileJsonLd } from "@/lib/schema";
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT THE SANITIZER ---

async function getProfile(username: string): Promise<UserProfile | null> {
  // --- (2) SANITIZE THE USERNAME INPUT IMMEDIATELY ---
  const sanitizedUsername = DOMPurify.sanitize(username);
  const cacheKey = `user:profile:${sanitizedUsername}`;

  try {
    const cached = await cacheGet<UserProfile>(cacheKey);
    if (cached) return cached;

    const client = await clientPromise;
    const db = client.db("whatsyourinfo");

    // --- (3) USE THE SANITIZED USERNAME FOR THE DATABASE QUERY ---
    const user = await db.collection("users").findOne(
      { username: sanitizedUsername },
      // Your projection is an excellent security practice.
      { projection: { password: 0 } }
    ) as UserProfile | null;
    if (!user) return null;

    const profile: UserProfile = {
      ...user,
      _id: user._id.toString()
    };
    
    // Note: The data you store in the cache is from the DB and is still considered "unsafe"
    // for direct rendering in scripts. It will be sanitized again before use.
    await redis.set(cacheKey, JSON.stringify(profile), { EX: 300 });

    return profile;
  } catch (error) {
    console.error("getProfile Redis/Mongo Error:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const profile = await getProfile(params.username);

  if (!profile) {
    return { title: "Profile Not Found | WhatsYour.Info", robots: { index: false, follow: false } };
  }

  // --- (4) SANITIZE DATA FROM DB BEFORE USING IN METADATA ---
  // This prevents Stored XSS in browser tabs, search results, and social media previews.
  const title = DOMPurify.sanitize(`${profile.firstName} ${profile.lastName} ...`);
  const description = DOMPurify.sanitize(profile.bio || `...`);
  const canonicalUrl = `https://whatsyour.info/${profile.username}`; // username is safe here as it's part of a URL path
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
  const profile = await getProfile(params.username);

  if (!profile) notFound();

  // --- (5) SANITIZE DATA FOR CLIENT-SIDE SCRIPTS ---
  // Sanitize the username again before injecting it into the analytics script string.
  const safeUsernameForScript = (profile.username || '').replace(/'/g, "\\'");
  
  const jsonLd = buildProfileJsonLd(profile);
  const jsonLdSafe = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return <>
    <section>
      <Script id="profile-analytics" strategy="afterInteractive">
        {`
          fetch('/api/analytics/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: '${safeUsernameForScript}', // Use the safe, escaped username
              referrer: document.referrer,
              userAgent: navigator.userAgent
            })
          }).catch(() => {});
        `}
      </Script>

      <Script
        id="profile-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSafe }}
      />

      {/* The PublicProfileView component is now responsible for sanitizing
          any data it renders as direct HTML (e.g., using dangerouslySetInnerHTML).
          Passing the raw profile object to it is fine, as long as the component
          itself is secure. */}
      <PublicProfileView profile={profile} />
    </section>
  </>
}