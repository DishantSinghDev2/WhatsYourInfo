// lib/logging.ts

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface LogData {
  keyId: ObjectId;
  userId: ObjectId;
  endpoint: string;
}

/**
 * Logs a successful API call to the database. This is designed to be
 * a "fire-and-forget" operation to not block the API response.
 */
export async function logApiCall(data: LogData): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');
    
    await db.collection('api_calls').insertOne({
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    // We log the error but don't throw it, as logging is a background task.
    console.error("Failed to log API call:", error);
  }
}