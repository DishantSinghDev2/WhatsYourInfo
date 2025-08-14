// app/blog/tags/page.tsx
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { blogClient } from '@/lib/blog-client';
import { Tag } from '@dishistech/blogs-sdk';

export const metadata = {
  title: 'All Tags | WhatsYour.Info Blog',
  description: 'Explore all tags and topics on the WhatsYour.Info blog.',
};
export default async function AllTagsPage() {
  const tags = await blogClient.getTags();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Explore Topics
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Find articles by specific keywords and tags.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {tags.map((tag: Tag) => (
            <Link
              key={tag.slug}
              href={`/blog/tags/${tag.slug}`}
              className="px-5 py-2.5 text-base font-medium border rounded-full bg-white hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
            >
              # {tag.name}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}