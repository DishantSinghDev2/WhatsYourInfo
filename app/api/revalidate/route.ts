// app/api/revalidate/route.ts (in your WhatsYour.Info project)

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import crypto from "crypto"; // Import the crypto module for secure signature verification

export async function POST(request: NextRequest) {
  // --- Improvement 1: Verify the Signature, Don't Just Check a Secret Token ---
  // This is much more secure than a simple secret in the URL.
  // It verifies that the request body hasn't been tampered with and truly comes from your CMS.
  try {
    const signature = request.headers.get('X-DITBlogs-Signature');
    if (!signature) {
      return NextResponse.json({ message: 'Signature header is missing.' }, { status: 401 });
    }

    const body = await request.text(); // Read the raw body text ONCE
    const expectedSignature = crypto
      .createHmac("sha256", process.env.WEBHOOK_SECRET!) // Use a dedicated webhook secret
      .update(body)
      .digest("hex");

    // Use a timing-safe comparison to prevent timing attacks
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
       return NextResponse.json({ message: 'Invalid signature.' }, { status: 401 });
    }

    // Now that the signature is verified, we can safely parse the JSON
    const data = JSON.parse(body);
    const eventType = data.event;
    const postSlug = data.payload?.post?.slug;

    // --- Improvement 2: Revalidate multiple paths based on the event ---
    // This makes your revalidation much more efficient and comprehensive.
    if (eventType === 'post.published' || eventType === 'post.unpublished') {
      if (!postSlug) {
        return NextResponse.json({ message: 'Post slug is required for this event.' }, { status: 400 });
      }
      
      console.log(`Revalidating paths for post: ${postSlug}`);

      // Revalidate the main blog index, the specific post, and potentially category/tag pages.
      const pathsToRevalidate = [
        '/blog',
        `/blog/${postSlug}`,
        // You could even get the category/tag from the payload and revalidate those too
        // e.g., `/blog/categories/${data.payload.post.category.slug}`
      ];

      pathsToRevalidate.forEach(path => revalidatePath(path));

      return NextResponse.json({
        revalidated: true,
        revalidatedPaths: pathsToRevalidate,
        now: Date.now(),
      });
    }

    return NextResponse.json({ message: 'Event type not handled.' }, { status: 200 });

  } catch (err: any) {
    console.error("Error during revalidation:", err);
    // Be careful not to leak internal error details to the client
    if (err.message.includes("Invalid signature")) {
       return NextResponse.json({ message: 'Invalid signature.' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Error processing request.' }, { status: 500 });
  }
}