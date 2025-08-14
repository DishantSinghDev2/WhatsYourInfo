// app/blog/[slug]/page.tsx (Updated version)
import { blogClient } from "@/lib/blog-client";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/blog/CommentForm"; // <-- Import form
import { Comment } from "@dishistech/blogs-sdk";
import { Badge } from "@/components/ui/Badge";
import { Calendar } from "lucide-react";

// Utility function for formatting dates
function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
}

// Function to generate Metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = await blogClient.getPost(params.slug);
    if (!post) return { title: 'Post Not Found' };
    return {
        title: `${post.title} | WhatsYour.Info Blog`,
        description: post.excerpt,
    };
}

// A simple component to render a comment and its replies
function CommentItem({ comment }: { comment: Comment }) {
    return (
        <div className="flex items-start space-x-3 py-4">
            <div className="flex-shrink-0">
                <img
                    className="h-10 w-10 rounded-full"
                    src={`https://ui-avatars.com/api/?name=${comment.user.name}&background=random`}
                    alt={comment.user.name || ''}
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                    {comment.user.name}
                </p>
                <p className="mt-1 text-gray-700">{comment.content}</p>
            </div>
        </div>
    );
}

export default async function SinglePostPage({ params }: { params: { slug: string } }) {
    // Fetch post and comments in parallel
    const [post, comments] = await Promise.all([
        blogClient.getPost(params.slug),
        blogClient.getComments(params.slug)
    ]);

    if (!post) {
        notFound();
    }

    return (
        <div className="bg-white">
            <Header />
            <article className="max-w-4xl mx-auto py-16 px-6">
                <header className="mb-12 text-center">
                    {post.category && <Badge>{post.category.name}</Badge>}
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mt-4">{post.title}</h1>
                    <p className="mt-4 text-lg text-gray-500">By {post.author.name}</p>
                    <div className="mt-2 text-sm text-gray-400 flex items-center justify-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Published on {formatDate(post.publishedAt)}</span>
                    </div>
                </header>
                
                {/* Render post content */}
                <div
                    className="prose lg:prose-xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: post.content || '' }}
                />

                {/* --- UPDATED COMMENTS SECTION --- */}
                <section id="comments" className="mt-20 border-t pt-10">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">
                        Discussion ({comments.length})
                    </h2>
                    
                    {/* Render the list of comments */}
                    <div className="space-y-4 divide-y">
                        {comments.length > 0 ? (
                           comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
                        ) : (
                           <p className="text-gray-500">Be the first to comment.</p>
                        )}
                    </div>
                    
                    {/* Render the form */}
                    <CommentForm postSlug={params.slug} />
                </section>
            </article>
            <Footer />
        </div>
    );
}