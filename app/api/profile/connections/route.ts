import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUserFromToken } from '@/lib/auth';

/**
 * Handles the disconnection of a verified social account from a user's profile.
 * HTTP Method: DELETE
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {NextResponse} - The response object.
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate the user using your in-house system.
    // This is the most critical security step.
    const user = await getUserFromToken(request)

    if (!user || !user._id) {
      // If no valid user is found from your token, deny the request immediately.
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to perform this action.' },
        { status: 401 }
      );
    }

    // 2. Validate the incoming request body.
    const { provider } = await request.json();

    if (!provider || typeof provider !== 'string') {
      // The frontend must specify which provider (e.g., 'github', 'twitter') to disconnect.
      return NextResponse.json(
        { error: 'Bad Request: A valid "provider" name is required in the request body.' },
        { status: 400 }
      );
    }

    // 3. Perform the database operation.
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Use the MongoDB `$pull` operator to remove an element from the `verifiedAccounts` array.
    // This operation is atomic and safe.
    const result = await db.collection('users').updateOne(
      // Filter: Ensure we only update the document for the currently logged-in user.
      { _id: new ObjectId(user._id) },
      // Update Operation: Remove the object from the array where the `provider` field matches.
      {
        $pull: {
          verifiedAccounts: { provider: provider }
        }
      }
    );

    // 4. Respond based on the outcome of the database operation.
    if (result.modifiedCount === 0) {
      // This case can occur if the user tries to disconnect an account that isn't connected.
      // It's not a server error, so we can inform the client.
      return NextResponse.json(
        { message: `Connection for provider "${provider}" not found or already removed.` },
        { status: 404 } // Not Found is an appropriate status here.
      );
    }

    // Success! The account was successfully disconnected.
    return NextResponse.json({
      message: `Account for provider "${provider}" has been successfully disconnected.`
    });

  } catch (error) {
    // 5. Handle unexpected server errors.
    console.error('Failed to disconnect account:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: Could not process your request.' },
      { status: 500 }
    );
  }
}