import { notFound } from "next/navigation"
import clientPromise from "@/lib/mongodb"
import type { Metadata } from "next"
import PublicProfileView from "@/components/profile/PublicProfileView"
import type { UserProfile } from "@/types"

// Define the correct type for params as a Promise
type Params = Promise<{ username: string }>

async function getProfile(username: string): Promise<UserProfile | null> {
  try {
    const client = await clientPromise
    const db = client.db("whatsyourinfo")
    const user = await db.collection("users").findOne(
      { username },
      {
        projection: {
          password: 0, // Never include password
        },
      },
    )

    if (!user) return null

    return {
      ...user,
      _id: user._id.toString(),
    } as UserProfile
  } catch (error) {
    console.error("Profile fetch error:", error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfile(username)

  if (!profile) {
    return {
      title: "Profile Not Found | What'sYour.Info",
      description: "The requested profile could not be found.",
    }
  }

  const title = `${profile.firstName} ${profile.lastName} | What'sYour.Info`
  const description =
    profile.bio || `Professional profile of ${profile.firstName} ${profile.lastName} on What'sYour.Info`
  const canonicalUrl = `https://whatsyour.info/${profile.username}`
  const avatar = `https://whatsyour.info/api/avatars/${profile.username}`

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
      siteName: "What'sYour.Info",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [avatar],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Params
}) {
  const { username } = await params
  const profile = await getProfile(username)

  if (!profile) notFound()

  return <PublicProfileView profile={profile} />
}
