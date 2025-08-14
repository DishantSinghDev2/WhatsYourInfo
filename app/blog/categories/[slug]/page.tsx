// app/blog/categories/[slug]/page.tsx
import { CategoryPage } from '@dishistech/blogs-react';

export default function SingleCategoryPage({ params }: { params: { slug: string } }) {
  return <CategoryPage slug={params.slug} />;
}