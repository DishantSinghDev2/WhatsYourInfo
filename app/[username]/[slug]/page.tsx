import { redirect } from "next/navigation"
import clientPromise from "@/lib/mongodb"

// Define the correct type for params as a Promise
type Params = Promise<{ username: string; slug: string }>

export default async function SmartRedirectPage({
  params,
}: {
  params: Params
}) {
  const { username, slug } = await params

  // Reserved paths (like /login, /profile, etc.)
  if (["profile", "login", "register", "api", "blog", "docs", "tools"].includes(username)) {
    return <p>Reserved path.</p>
  }

  try {
    const client = await clientPromise
    const db = client.db("whatsyourinfo")
    const user = await db.collection("users").findOne({ username })

    if (user?.isProUser && Array.isArray(user.redirects)) {
      const matched = user.redirects.find((r: { slug: string }) => r.slug === slug)
      if (matched) {
        redirect(matched.url)
      }
    }

    return user?.isProUser ? (
      <p>
        No redirects found for this URL. Go to <strong>profile → tools → smart redirects</strong> to create one.
      </p>
    ) : (
      <p>Smart redirects are only available to Pro Users.</p>
    )
  } catch (error) {
    console.error("Database connection error:", error)
    return <p>Unable to process request. Please try again later.</p>
  }
}
