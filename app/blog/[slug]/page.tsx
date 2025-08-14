// app/blog/[slug]/page.tsx
import { PostDetailsPage } from '@dishistech/blogs-react';

export default function SinglePostPage({ params }: { params: { slug: string } }) {
  // This is where you would get a logged-in user's token from your
  // WhatsYour.Info authentication system (e.g., NextAuth.js, Clerk).
  // const session = await auth();
  // const userToken = session?.accessToken;

  return (
    <PostDetailsPage
      slug={params.slug}
      // userToken={userToken}
    />
  );
}