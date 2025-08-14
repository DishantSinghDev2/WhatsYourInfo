// app/blog/tags/page.tsx
import { TagsListPage } from '@dishistech/blogs-react';

export const metadata = {
  title: 'Tags | WhatsYour.Info Blog',
};

export default function AllTagsPage() {
  return (
    <>
      <h1 className="text-4xl font-extrabold text-center mb-12">
        Explore Topics
      </h1>
      <TagsListPage />
    </>
  );
}