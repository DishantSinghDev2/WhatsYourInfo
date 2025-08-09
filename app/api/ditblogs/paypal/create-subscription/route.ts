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
  // This route re-uses the logic from your existing PayPal route.
  // The main change is selecting the plan ID based on the incoming request.
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan, yearly } = await request.json(); // e.g., plan: 'GROWTH', yearly: true
  
  const planId = planMap[plan as keyof typeof planMap]?.[yearly ? 'yearly' : 'monthly'];
  if (!planId) return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
  
  // ... (The rest of your PayPal API call logic from the provided example) ...
  // Remember to replace 'custom_id' with the user's ID for tracking.
  // ...
  
  // On success, return:
  // return NextResponse.json({ approvalUrl: approvalLink.href });
}