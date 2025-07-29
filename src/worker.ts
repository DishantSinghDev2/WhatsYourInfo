// src/worker.ts

/**
 * Defines the environment variables and R2 bindings available to the worker.
 */
export interface Env {
  AVATAR_BUCKET: R2Bucket;
  HEADER_BUCKET: R2Bucket;
  BACKGROUND_BUCKET: R2Bucket;
  GALLERY_BUCKET: R2Bucket; // New gallery bucket
}

// Helper function to select the correct bucket based on type
function getBucket(type: string | null, env: Env): R2Bucket | null {
  switch (type) {
    case 'avatar':
      return env.AVATAR_BUCKET;
    case 'header':
      return env.HEADER_BUCKET;
    case 'background':
      return env.BACKGROUND_BUCKET;
    case 'gallery': // Handle the 'gallery' type
      return env.GALLERY_BUCKET;
    default:
      return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // --- UPLOAD HANDLER (PUT requests) ---
    if (request.method === 'PUT') {
      const key = url.searchParams.get('key');
      const type = url.searchParams.get('type');
      const bucket = getBucket(type, env);

      if (!key) return new Response('Missing "key" query parameter', { status: 400 });
      if (!bucket) return new Response('Invalid "type" specified', { status: 400 });

      const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
      await bucket.put(key, request.body, { httpMetadata: { contentType } });

      return new Response(JSON.stringify({ key, type }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // --- DELETE HANDLER (DELETE requests) ---
    if (request.method === 'DELETE') {
      const key = url.searchParams.get('key');
      const type = url.searchParams.get('type');
      const bucket = getBucket(type, env);

      if (!key) return new Response('Missing "key" query parameter', { status: 400 });
      if (!bucket) return new Response('Invalid "type" specified', { status: 400 });
      
      await bucket.delete(key);

      return new Response(JSON.stringify({ message: 'Object deleted successfully', key }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // --- SERVING HANDLER (GET requests) ---
    if (request.method === 'GET') {
      const key = pathname.slice(1);
      let bucket: R2Bucket;

      if (pathname.startsWith('/avatars/')) bucket = env.AVATAR_BUCKET;
      else if (pathname.startsWith('/headers/')) bucket = env.HEADER_BUCKET;
      else if (pathname.startsWith('/backgrounds/')) bucket = env.BACKGROUND_BUCKET;
      else if (pathname.startsWith('/gallery/')) bucket = env.GALLERY_BUCKET; // Serve from gallery bucket
      else return new Response('Not Found', { status: 404 });

      const object = await bucket.get(key);
      if (object === null) return new Response('Object Not Found', { status: 404 });

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=604800, immutable',
          'ETag': object.httpEtag,
        },
      });
    }

    return new Response('Method Not Allowed', { status: 405 });
  },
};