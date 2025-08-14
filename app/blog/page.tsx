// app/blog/page.tsx
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { blogClient } from '@/lib/blog-client';
import { Post, Category } from '@dishistech/blogs-sdk'; // Import types

// A utility function for formatting dates
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Reusable PostCard component
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

// The main page component is a React Server Component
export default async function BlogPage() {
  // Fetch all data in parallel for performance
  const [postsResponse, categories] = await Promise.all([
    blogClient.getPosts({ limit: 10 }), // Fetch more to find featured/recent
    blogClient.getCategories(),
  ]);

  const allPosts = postsResponse.posts;
  // Let's assume the first post is "featured" for this design
  const featuredPost = allPosts.length > 0 ? allPosts[0] : null;
  const recentPosts = allPosts.length > 1 ? allPosts.slice(1) : [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Blog & Insights</h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Stay up to date with the latest developments in digital identity, developer tools, and platform updates.
            </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="border-gray-200 mb-8">
              <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Link href="/blog">
                    <Button variant="ghost" className="w-full justify-between">All Posts <Badge variant="secondary">{postsResponse.pagination.total}</Badge></Button>
                </Link>
                {categories.map((category: Category) => (
                  <Link key={category.slug} href={`/blog/categories/${category.slug}`}>
                    <Button variant="ghost" className="w-full justify-start">{category.name}</Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
            {/* Newsletter Card can remain as is */}
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Featured Post */}
            {featuredPost && (
              <Card className="border-gray-200 mb-12 overflow-hidden">
                <div className="p-6">
                  {featuredPost.category && <Badge>{featuredPost.category.name}</Badge>}
                  <h2 className="text-2xl font-bold text-gray-900 my-3">{featuredPost.title}</h2>
                  <p className="text-gray-600 mb-4">{featuredPost.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(featuredPost.publishedAt)}</span>
                    </div>
                    <Link href={`/blog/${featuredPost.slug}`}>
                      <Button variant="outline" size="sm">Read More <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Posts Grid */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentPosts.map((post: Post) => <PostCard key={post.slug} post={post} />)}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}