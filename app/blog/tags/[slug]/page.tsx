// app/blog/tags/[slug]/page.tsx
import { TagPage } from '@dishistech/blogs-react';

export default function SingleTagPage({ params }: { params: { slug: string } }) {
  return <TagPage slug={params.slug} />;
}