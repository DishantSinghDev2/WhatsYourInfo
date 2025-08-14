// app/blog/categories/page.tsx
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { blogClient } from '@/lib/blog-client';
import { Category } from '@dishistech/blogs-sdk';
import { Code, Shield, Zap, Sparkles } from 'lucide-react'; // Example icons

// You can create a map to assign icons to your categories
const iconMap: { [key: string]: React.ElementType } = {
  development: Code,
  security: Shield,
  product: Zap,
  default: Sparkles,
};

export const metadata = {
  title: 'All Categories | WhatsYour.Info Blog',
  description: 'Browse all topics and categories on the WhatsYour.Info blog.',
};

export default async function AllCategoriesPage() {
  const categories = await blogClient.getCategories();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Browse by Category
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Find articles on the topics that interest you most.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category: Category) => {
            const Icon = iconMap[category.slug] || iconMap.default;
            return (
              <Link key={category.slug} href={`/blog/categories/${category.slug}`}>
                <Card className="border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                    <CardTitle className="text-gray-900">{category.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}