// app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const users = await db.collection('users').find(
      {},
      {
        projection: {
          username: 1,
          updatedAt: 1,
        }
      }
    ).toArray();

    const baseUrl = 'https://whatsyour.info';
    const currentDate = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;

    // Static pages
    const staticRoutes = [
      { loc: '/', changefreq: 'daily', priority: '1.0' },
      { loc: '/pricing', changefreq: 'weekly', priority: '0.8' },
      { loc: '/docs', changefreq: 'weekly', priority: '0.8' },
      { loc: '/blog', changefreq: 'daily', priority: '0.7' },
    ];

    for (const route of staticRoutes) {
      sitemap += `  <url>
    <loc>${baseUrl}${route.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
    }

    // Dynamic user profiles
    users.forEach((user) => {
      const lastmod = user.updatedAt
        ? new Date(user.updatedAt).toISOString().split('T')[0]
        : currentDate;

      sitemap += `  <url>
    <loc>${baseUrl}/${user.username}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    });

    sitemap += '</urlset>';

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('Failed to generate sitemap:', err);

    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}
