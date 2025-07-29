import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import crypto from 'crypto';
import { ObjectId } from 'mongodb'; // Important: Import ObjectId

// Expanded Zod schema for validation
const createClientSchema = z.object({
    name: z.string().min(1, 'Application name is required').max(50),
    description: z.string().max(300).optional(),
    homepageUrl: z.string().url('Homepage URL must be a valid URL.').optional(),
    appLogo: z.string().url('Logo URL must be a valid URL.').optional(),
    redirectUris: z.array(z.string().url('Each Redirect URI must be a valid URL.')).min(1),
    grantedScopes: z.array(z.string()).optional(), // Scopes the app is allowed to request
});

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('whatsyourinfo');
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // --- NEW: Fetch a single client if an ID is provided ---
        if (id) {
            if (!ObjectId.isValid(id)) {
                return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
            }

            const oauthClient = await db.collection('oauth_clients').findOne({
                _id: new ObjectId(id),
                userId: user._id, // Ensure the user owns this client
            });

            if (!oauthClient) {
                return NextResponse.json({ error: 'OAuth client not found' }, { status: 404 });
            }

            return NextResponse.json({
                client: { ...oauthClient, _id: oauthClient._id.toString() },
            });
        }
        // --- End of new logic ---

        // Original logic: Fetch all clients for the user
        const clients = await db.collection('oauth_clients').find(
            { userId: user._id },
            { sort: { createdAt: -1 } }
        ).toArray();

        return NextResponse.json({
            clients: clients.map(c => ({
                ...c,
                _id: c._id.toString(),
            }))
        });

    } catch (error) {
        console.error('OAuth clients fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createClientSchema.parse(body);

        const clientId = `wyi_client_${crypto.randomBytes(16).toString('hex')}`;
        const clientSecret = `wyi_secret_${crypto.randomBytes(32).toString('hex')}`;

        const client = await clientPromise;
        const db = client.db('whatsyourinfo');

        const clientData = {
            userId: user._id,
            name: validatedData.name,
            description: validatedData.description,
            appLogo: validatedData.appLogo,
            homepageUrl: validatedData.homepageUrl,
            clientId,
            clientSecret,
            redirectUris: validatedData.redirectUris,
            grantedScopes: validatedData.grantedScopes || [],
            isInternal: false,
            isActive: true,
            createdAt: new Date(),
        };

        const result = await db.collection('oauth_clients').insertOne(clientData);


        return NextResponse.json({
            message: 'OAuth client created successfully',
            client: {
                ...clientData,
                _id: result.insertedId.toString(),
            }
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
        }

        console.error('OAuth client creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// --- NEW: Add a DELETE handler to this route ---
export async function DELETE(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('whatsyourinfo');

        const result = await db.collection('oauth_clients').deleteOne({
            _id: new ObjectId(id),
            userId: user._id, // Critical check to ensure users can only delete their own apps
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Client not found or you do not have permission to delete it' }, { status: 404 });
        }

        return NextResponse.json({ message: 'OAuth client deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error('OAuth client deletion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

const updateClientSchema = z.object({
  name: z.string().min(1, 'Application name is required').max(50).optional(),
  description: z.string().max(300).optional().nullable(),
  homepageUrl: z.string().url('Homepage URL must be a valid URL.').optional().nullable(),
  appLogo: z.string().url('Logo URL must be a valid URL.').optional().nullable(),
  redirectUris: z.array(z.string().url()).min(1, 'At least one Redirect URI is required.').optional(),
  grantedScopes: z.array(z.string()).optional(),
});

// --- NEW: Add a PATCH handler for updating clients ---
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid Client ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Construct the update object to avoid clearing fields with undefined
    const updateFields: { [key: string]: any } = {};
    Object.keys(validatedData).forEach(key => {
        const value = (validatedData as any)[key];
        if (value !== undefined) {
            updateFields[key] = value;
        }
    });

    if (Object.keys(updateFields).length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const result = await db.collection('oauth_clients').updateOne(
      { _id: new ObjectId(id), userId: user._id }, // Ensure user owns the client
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Client not found or you do not have permission' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Application updated successfully' }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('OAuth client update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
