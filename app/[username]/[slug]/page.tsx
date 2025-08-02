import { redirect } from "next/navigation"
import clientPromise from "@/lib/mongodb"

type Params = Promise<{ username: string; slug: string }>

export default async function SmartRedirectPage({
  params,
}: {
  params: Params
}) {
  const { username, slug } = await params

  if (["profile", "login", "register", "api", "blog", "docs", "tools"].includes(username)) {
    return <p>Reserved path.</p>
  }

  let user = null

  try {
    const client = await clientPromise
    const db = client.db("whatsyourinfo")
    user = await db.collection("users").findOne({ username })

    if (user?.isProUser && Array.isArray(user.redirects)) {
      const matched = user.redirects.find((r: { slug: string }) => r.slug === slug)
      if (matched) {
        // ⚠️ This throws NEXT_REDIRECT — don’t catch it!
        redirect(matched.url)
      }
    }
  } catch (error: any) {
    // Re-throw if it's a redirect to avoid breaking
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error
    console.error("Database connection error:", error)
    return <p>Unable to process request. Please try again later.</p>
  }

  return user?.isProUser ? (
    <p>
      No redirects found for this URL. Go to <strong>profile → tools → smart redirects</strong> to create one.
    </p>
  ) : (
    <p>Smart redirects are only available to Pro Users.</p>
  )
}
