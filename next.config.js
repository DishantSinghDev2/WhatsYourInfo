/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: 'my-value',
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      // Handle subdomain routing
      {
        source: '/(.*)',
        has: [
          {
            type: 'host',
            value: '(?<subdomain>.*)\\.whatsyour\\.info',
          },
        ],
        destination: '/:subdomain',
      },
    ];
  },
  async headers() {
    // Construct the Content Security Policy
    // We are adding 'blob:' to connect-src to allow libraries to fetch data from local object URLs.
    const csp = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      connect-src 'self' https: blob:; 
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim(); // Clean up whitespace

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;