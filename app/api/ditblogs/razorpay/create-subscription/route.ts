import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import Razorpay from 'razorpay';

const planMap = {
  GROWTH: {
    monthly: process.env.RAZORPAY_DITBLOGS_GROWTH_MONTHLY_PLAN_ID,
    yearly: process.env.RAZORPAY_DITBLOGS_GROWTH_YEARLY_PLAN_ID,
  },
  SCALE: {
    monthly: process.env.RAZORPAY_DITBLOGS_SCALE_MONTHLY_PLAN_ID,
    yearly: process.env.RAZORPAY_DITBLOGS_SCALE_YEARLY_PLAN_ID,
  },
};

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan, yearly } = await request.json();
  const plan_id = planMap[plan as keyof typeof planMap]?.[yearly ? 'yearly' : 'monthly'];
  if (!plan_id) return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });

  const options = {
    plan_id,
    quantity: 1,
    customer_notify: 1,
    notes: {
        userId: user._id.toString(),
        email: user.email,
    }
  };

  try {
    const subscription = await instance.subscriptions.create(options);
    return NextResponse.json({
        subscriptionId: subscription.id,
        keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay subscription creation failed:', error);
    return NextResponse.json({ error: 'Failed to create subscription.' }, { status: 500 });
  }
}