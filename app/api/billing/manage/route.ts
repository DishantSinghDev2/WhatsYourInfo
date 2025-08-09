import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getPayPalAccessToken, getPayPalApiBase } from '@/lib/paypal';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // --- NEW: Receive productKey to know which subscription to manage ---
    const { productKey } = await request.json(); 
    if (!productKey) {
        return NextResponse.json({ error: 'Product key is required.' }, { status: 400 });
    }

    let subscriptionId;
    let provider;
    
    // --- 1. Find the correct subscription details based on productKey ---
    if (productKey === 'wyi_pro' && user.subscriptionId) {
        subscriptionId = user.subscriptionId;
        provider = user.subscriptionProvider;
    } else {
        const db = (await clientPromise).db('whatsyourinfo');
        const ditSub = await db.collection('ditSub').findOne({ userId: new ObjectId(user._id) });
        
        // This can be expanded with a switch for DITMail, etc.
        if (productKey === 'ditblogs' && ditSub?.ditblogs?.subscriptionId) {
            subscriptionId = ditSub.ditblogs.subscriptionId;
            provider = ditSub.ditblogs.provider;
        }
    }
    
    if (!subscriptionId || !provider) {
        return NextResponse.json({ error: 'Active subscription for this product not found.' }, { status: 404 });
    }

    // --- 2. Generate the management URL based on the provider ---
    let managementUrl: string;

    if (provider === 'paypal') {
        // For PayPal, there isn't a direct "management portal" link via API.
        // The standard practice is to redirect the user to their main subscriptions page.
        const apiBase = getPayPalApiBase();
        // The URL is different for sandbox vs live
        managementUrl = apiBase.includes('sandbox') 
            ? 'https://www.sandbox.paypal.com/myaccount/autopay/' 
            : 'https://www.paypal.com/myaccount/autopay/';

    } else if (provider === 'razorpay') {
        // For Razorpay, you direct users to the customer portal URL.
        // The portal must be enabled in your Razorpay settings.
        managementUrl = 'https://dashboard.razorpay.com/customer/subscriptions';
        
    } else {
        return NextResponse.json({ error: 'Unsupported subscription provider.' }, { status: 400 });
    }

    return NextResponse.json({ url: managementUrl });

  } catch (error) {
    console.error("Billing management error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}