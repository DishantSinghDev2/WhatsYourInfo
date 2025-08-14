// lib/blog-client.ts (Create this new file)
import { DITBlogsClient } from '@dishistech/blogs-sdk';

// This creates a single, cached instance of the client for your server.
// The `globalThis` trick prevents re-creation during hot-reloading in development.
const globalForClient = globalThis as unknown as {
  ditBlogsClient: DITBlogsClient | undefined;
};

export const blogClient =
  globalForClient.ditBlogsClient ?? new DITBlogsClient(process.env.DITBLOGS_API_KEY!);

if (process.env.NODE_ENV !== 'production') {
  globalForClient.ditBlogsClient = blogClient;
}