// app/blog/page.tsx
import { PostsListPage } from '@dishistech/blogs-react';

export const metadata = {
  title: 'Blog | WhatsYour.Info',
};

export default function BlogIndexPage() {
  return (
    <PostsListPage />
  );
}