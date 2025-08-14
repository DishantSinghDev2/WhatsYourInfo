// app/blog/layout.tsx  <-- NEW FILE
import { BlogLayout } from '@dishistech/blogs-react';
import Link from 'next/link';

// You can define blog-specific navigation links here
const blogNavLinks = [
  { href: "/blog", label: "All Posts" },
  { href: "/blog/categories", label: "Categories" },
  { href: "/blog/tags", label: "Tags" },
];

export default function DITBlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BlogLayout
      apiKey={process.env.NEXT_PUBLIC_DITBLOGS_API_KEY!}
      theme="dark" // Choose the theme that matches your site
      navLinks={blogNavLinks}
      linkComponent={Link}
    >
      {children}
    </BlogLayout>
  );
}