// app/api/v1/webhooks/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAndAuthorizeToken } from '@/lib/api-auth';
import { z } from 'zod'; // --- (1) IMPORT ZOD ---
import DOMPurify from 'isomorphic-dompurify'; // --- (1) IMPORT SANITIZER ---

// --- (2) DEFINE A STRICT SCHEMA FOR THE REQUEST BODY ---
const verificationSchema = z.object({
  // Enforces that the event_id is a string and starts with 'evt_'
  event_id: z.string().trim().startsWith('evt_', { message: "Invalid event_id format." }),
});

export async function POST(request: NextRequest) {
    try {
        // This is a perfect authorization implementation. No changes needed.
        const auth = await verifyAndAuthorizeToken(request, ['webhook:verify']);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized. Invalid token to perform this action (webhook:verify).' }, { status: 401 });
        }

        const body = await request.json();
        // --- (3) VALIDATE THE REQUEST BODY USING THE SCHEMA ---
        const validatedData = verificationSchema.parse(body);

        // --- (4) SANITIZE THE VALIDATED EVENT ID ---
        const sanitizedEventId = DOMPurify.sanitize(validatedData.event_id);

        const db = (await clientPromise).db('whatsyourinfo');

        // --- (5) USE THE SANITIZED ID FOR THE DATABASE QUERY ---
        const event = await db.collection('webhook_events').findOne({ id: sanitizedEventId });

        if (!event) {
            return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
        }

        // --- Optional Security Check (This is a great idea) ---
        // If your event document stores which client it was sent to, you can verify it here:
        // if (event.clientId.toString() !== auth.oauthClientId.toString()) {
        //     return NextResponse.json({ error: 'Client not authorized for this event.' }, { status: 403 });
        // }

        // The data from your DB is trusted, so it's safe to return.
        return NextResponse.json(event, { status: 200 });

    } catch (error) {
        // --- (6) ADD SPECIFIC ERROR HANDLING FOR ZOD ---
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.flatten().fieldErrors }, { status: 400 });
        }
        console.error('Webhook Verification Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}