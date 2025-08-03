import { redirect } from "next/navigation"
import clientPromise from "@/lib/mongodb"
import redis from "@/lib/redis";

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

  const cacheKey = `smartredirect:${username}`;
let userData = null;

try {
  const cached = await redis.get(cacheKey);
  if (cached) {
    userData = JSON.parse(cached);
  } else {
    const client = await clientPromise;
    const db = client.db("whatsyourinfo");
    const user = await db.collection("users").findOne(
      { username },
      { projection: { isProUser: 1, redirects: 1 } }
    );

    if (user) {
      userData = {
        isProUser: !!user.isProUser,
        redirects: Array.isArray(user.redirects) ? user.redirects : [],
      };
      // Cache for 10 minutes
      await redis.set(cacheKey, JSON.stringify(userData), { EX: 600 });
    }
  }
} catch (err) {
  console.error("Redirect cache/db error:", err);
}


  return userData?.isProUser ? (
    <p>
      No redirects found for this URL. Go to <strong>profile → tools → smart redirects</strong> to create one.
    </p>
  ) : (
    <p>Smart redirects are only available to Pro Users.</p>
  )
}
