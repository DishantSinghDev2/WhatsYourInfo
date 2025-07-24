export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Upload handler
    if (request.method === 'PUT') {
      const key = url.searchParams.get("key");
      if (!key) return new Response('Missing key', { status: 400 });

      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      const object = await request.arrayBuffer();

      await env.AVATAR_BUCKET.put(key, object, {
        httpMetadata: { contentType },
      });

      return new Response(JSON.stringify({ key }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Serve avatars: /avatars/<filename>
    if (request.method === 'GET' && pathname.startsWith('/avatars/')) {
      const key = pathname.slice(1); // removes leading "/"
      const object = await env.AVATAR_BUCKET.get(key);

      if (!object) {
        return new Response('Not found', { status: 404 });
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000'
        },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}
