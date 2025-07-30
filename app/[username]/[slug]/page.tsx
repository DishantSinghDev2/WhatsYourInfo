import { redirect } from 'next/navigation';
import clientPromise from '@/lib/mongodb';

export default async function SmartRedirectPage({ params }: { params: { username: string, slug: string } }) {
  const { username, slug } = params;

  if (['profile', 'login', 'register', 'api'].includes(username)) {
    return <p>Reserved path.</p>; // Optional fallback
  }

  const client = await clientPromise;
  const db = client.db('whatsyourinfo');
  const user = await db.collection('users').findOne({ username });

  if (user?.isProUser && Array.isArray(user.redirects)) {
    const matched = user.redirects.find((r: any) => r.slug === slug);
    if (matched) {
      redirect(matched.url);
    }
  }

  return user?.isProUser ? <p>No redirects found from this url. Go to profile/tools/smart redirects to create one.</p> : <p>Smart redirects are only for Pro Users</p>;
}
