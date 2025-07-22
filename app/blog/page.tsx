import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowRight,
  Calendar,
  Clock,
  User,
  Sparkles,
  Code,
  Shield,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const blogPosts = [
  {
    id: 1,
    title: 'Building the Future of Digital Identity',
    excerpt: 'How What\'sYour.Info is revolutionizing the way we think about online profiles and authentication.',
    content: 'In today\'s digital landscape, managing multiple online identities has become increasingly complex...',
    author: 'Sarah Chen',
    authorAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    publishedAt: new Date('2025-01-15'),
    readTime: 5,
    category: 'Product',
    tags: ['Identity', 'Future', 'Digital'],
    featured: true,
    image: 'https://images.pexels.com/photos/3861943/pexels-photo-3861943.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
  },
  {
    id: 2,
    title: 'Developer Guide: Implementing SSO with What\'sYour.Info',
    excerpt: 'A comprehensive tutorial on integrating What\'sYour.Info authentication into your applications.',
    content: 'Single Sign-On (SSO) has become essential for modern applications. Here\'s how to implement it...',
    author: 'Marcus Johnson',
    authorAvatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    publishedAt: new Date('2025-01-12'),
    readTime: 8,
    category: 'Development',
    tags: ['SSO', 'API', 'Tutorial'],
    featured: false,
    image: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
  },
  {
    id: 3,
    title: 'AI-Powered Profile Enhancement: The Technology Behind Smart Bios',
    excerpt: 'Discover how we use Google Gemini AI to help users create compelling professional profiles.',
    content: 'Artificial Intelligence is transforming how we create and optimize professional content...',
    author: 'Emily Rodriguez',
    authorAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    publishedAt: new Date('2025-01-08'),
    readTime: 6,
    category: 'Technology',
    tags: ['AI', 'Machine Learning', 'Profiles'],
    featured: false,
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
  },
  {
    id: 4,
    title: 'Security Best Practices for Identity Platforms',
    excerpt: 'How What\'sYour.Info ensures your data remains secure while providing seamless authentication.',
    content: 'Security is paramount in identity management. Here are the practices we follow...',
    author: 'David Kim',
    authorAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    publishedAt: new Date('2025-01-05'),
    readTime: 7,
    category: 'Security',
    tags: ['Security', 'Privacy', 'Best Practices'],
    featured: false,
    image: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
  },
  {
    id: 5,
    title: 'The Rise of Decentralized Identity Management',
    excerpt: 'Exploring the future of identity verification and how blockchain technology is changing the game.',
    content: 'Decentralized identity is becoming a reality. Let\'s explore what this means...',
    author: 'Lisa Wang',
    authorAvatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    publishedAt: new Date('2025-01-02'),
    readTime: 9,
    category: 'Innovation',
    tags: ['Blockchain', 'Decentralization', 'Future'],
    featured: false,
    image: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
  },
];

const categories = [
  { name: 'All Posts', count: blogPosts.length, icon: Sparkles },
  { name: 'Development', count: blogPosts.filter(p => p.category === 'Development').length, icon: Code },
  { name: 'Security', count: blogPosts.filter(p => p.category === 'Security').length, icon: Shield },
  { name: 'Product', count: blogPosts.filter(p => p.category === 'Product').length, icon: Zap },
];

export default function BlogPage() {
  const featuredPost = blogPosts.find(post => post.featured);
  const recentPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Blog & Insights
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Stay up to date with the latest developments in digital identity, 
              developer tools, and platform updates.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 mb-8">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category.name}
                      variant="ghost"
                      className="w-full justify-between"
                    >
                      <div className="flex items-center">
                        <category.icon className="h-4 w-4 mr-2" />
                        {category.name}
                      </div>
                      <Badge variant="secondary">{category.count}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Newsletter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Get the latest updates and insights delivered to your inbox.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button className="w-full">
                    Subscribe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            {featuredPost && (
              <Card className="border-gray-200 mb-12 overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="h-64 w-full object-cover md:h-full"
                    />
                  </div>
                  <div className="p-6 md:w-1/2">
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge>{featuredPost.category}</Badge>
                      <Badge variant="secondary">Featured</Badge>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={featuredPost.authorAvatar}
                          alt={featuredPost.author}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{featuredPost.author}</p>
                          <div className="flex items-center text-gray-500 space-x-2">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(featuredPost.publishedAt)}</span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{featuredPost.readTime} min read</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/blog/${featuredPost.id}`}>
                        <Button variant="outline" size="sm">
                          Read More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Posts Grid */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recentPosts.map((post) => (
                    <Card key={post.id} className="border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="aspect-w-16 aspect-h-9">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-48 w-full object-cover rounded-t-lg"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge>{post.category}</Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={post.authorAvatar}
                              alt={post.author}
                              className="h-6 w-6 rounded-full"
                            />
                            <div className="text-xs text-gray-500">
                              <p className="font-medium">{post.author}</p>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{post.readTime} min read</span>
                              </div>
                            </div>
                          </div>
                          <Link href={`/blog/${post.id}`}>
                            <Button variant="ghost" size="sm">
                              Read More
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}