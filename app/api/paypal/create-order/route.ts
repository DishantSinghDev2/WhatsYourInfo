import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import client from '@/lib/paypal';
import paypal from '@paypal/checkout-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, yearly } = await request.json();

    if (plan !== 'Pro') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const price = yearly ? '59.00' : '6.00';
    const currency = 'USD';

    const requestBody = {
      intent: 'SUBSCRIBE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: price,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'WhatsYourInfo',
            locale: 'en-US',
            landing_page: 'LOGIN',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
          },
        },
      },
      metadata: {
        user_id: user._id,
        plan: plan,
      },
    };

    const payPalRequest = new paypal.orders.OrdersCreateRequest();
    payPalRequest.requestBody(requestBody);

    const order = await client.execute(payPalRequest);

    return NextResponse.json({ id: order.result.id });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}