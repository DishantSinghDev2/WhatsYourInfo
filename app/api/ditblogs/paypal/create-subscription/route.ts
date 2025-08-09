import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

const planMap = {
    GROWTH: {
        monthly: process.env.PAYPAL_DITBLOGS_GROWTH_MONTHLY_PLAN_ID,
        yearly: process.env.PAYPAL_DITBLOGS_GROWTH_YEARLY_PLAN_ID,
    },
    SCALE: {
        monthly: process.env.PAYPAL_DITBLOGS_SCALE_MONTHLY_PLAN_ID,
        yearly: process.env.PAYPAL_DITBLOGS_SCALE_YEARLY_PLAN_ID,
    },
};

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { plan, yearly } = await request.json(); // e.g., plan: 'GROWTH', yearly: true

        const planId = planMap[plan as keyof typeof planMap]?.[yearly ? 'yearly' : 'monthly'];
        if (!planId) return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });

        // === 1. Fetch access token manually ===
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            console.error('PayPal credentials missing');
            return NextResponse.json({ error: 'Server config error' }, { status: 500 });
        }

        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const apiBase = process.env.NODE_ENV === 'production'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        const tokenResp = await fetch(`${apiBase}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        if (!tokenResp.ok) {
            const text = await tokenResp.text();
            console.error('PayPal token fetch failed:', tokenResp.status, text);
            return NextResponse.json({ error: 'PayPal auth failed' }, { status: 500 });
        }

        const { access_token: accessToken } = await tokenResp.json();
        if (!accessToken) {
            console.error('Missing access_token in PayPal response', await tokenResp.text());
            return NextResponse.json({ error: 'PayPal auth failed' }, { status: 500 });
        }

        // === 2. Create subscription via REST API ===
        const subResp = await fetch(`${apiBase}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'PayPal-Request-Id': user._id.toString(),
            },
            body: JSON.stringify({
                plan_id: planId,
                custom_id: user._id.toString(),
                application_context: {
                    brand_name: 'DITBlogs',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'SUBSCRIBE_NOW',
                    return_url: `https://blogs.dishis.tech/dashboard?paypal_success=true`,
                    cancel_url: `https://blogs.dishis.tech/pricing?paypal_cancel=true`,
                },
            }),
        });

        if (!subResp.ok) {
            const text = await subResp.text();
            console.error('PayPal subscription API failed:', subResp.status, text);
            return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }

        const subscription = await subResp.json();
        const approvalLink = (subscription.links || []).find((l: { rel: string }) => l.rel === 'approve');
        if (!approvalLink) {
            console.error('Approval link missing in PayPal response', subscription);
            return NextResponse.json({ error: 'Approval link not found' }, { status: 500 });
        }

        return NextResponse.json({ approvalUrl: approvalLink.href });

    } catch (err) {
        console.error('Subscription creation exception:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}