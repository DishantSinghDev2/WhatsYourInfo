// app/blog/categories/[slug]/page.tsx
import { blogClient } from "@/lib/blog-client";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';
import { Post } from "@dishistech/blogs-sdk";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

// You can create a reusable PostCard here or import it
function PostCard({ post }: { post: Post }) {
  return (
    <Card className="border-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {post.category && <Badge className="mb-3">{post.category.name}</Badge>}
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600">
            {post.title}
          </h3>
        </Link>
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        <div className="flex items-center text-xs text-gray-500 space-x-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(post.publishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function SingleCategoryPage({ params }: { params: { slug: string } }) {
    const response = await blogClient.getCategory(params.slug);
    if (!response || !response.category) {
        notFound();
    }
    
    const { category, posts } = response;

    return (
        <div className="bg-white">
            <Header />
            <main className="max-w-7xl mx-auto py-16 px-6">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900">Category: {category.name}</h1>
                    {category.description && <p className="mt-2 text-lg text-gray-600">{category.description}</p>}
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => <PostCard key={post.slug} post={post} />)}
                </div>
            </main>
            <Footer />
        </div>
    );
}