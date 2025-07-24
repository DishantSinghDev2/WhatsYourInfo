import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import client from '@/lib/paypal';
import paypal from '@paypal/checkout-server-sdk';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderID } = await request.json();

    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
    captureRequest.requestBody({});

    const capture = await client.execute(captureRequest);
    const subscriptionId =
      capture.result.purchase_units[0].payments.captures[0].id;

    const mongoClient = await clientPromise;
    const db = mongoClient.db('whatsyourinfo');

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          isProUser: true,
          paypalSubscriptionId: subscriptionId,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayPal capture order error:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal order' },
      { status: 500 }
    );
  }
}