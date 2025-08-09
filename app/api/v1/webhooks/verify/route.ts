import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAndAuthorizeToken } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAndAuthorizeToken(request, ['webhook:verify']);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized. Invalid token to perform this action (webhook:verify).' }, { status: 401 });
        }

        const { event_id } = await request.json();

        if (!event_id || !event_id.startsWith('evt_')) {
            return NextResponse.json({ error: 'Invalid event_id format.' }, { status: 400 });
        }

        const db = (await clientPromise).db('whatsyourinfo');

        // Retrieve the event from our logs
        const event = await db.collection('webhook_events').findOne({ id: event_id });

        if (!event) {
            return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
        }

        // Optional: Add a check to ensure the client requesting verification
        // is one that should have received this event. This adds another layer of security.

        // Return the full, original event object upon successful verification
        return NextResponse.json(event, { status: 200 });

    } catch (error) {
        console.error('Webhook Verification Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}