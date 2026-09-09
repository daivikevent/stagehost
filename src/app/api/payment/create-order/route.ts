/**
 * Razorpay Order Creation API
 * POST /api/payment/create-order
 * Creates a Razorpay order for a plan upgrade.
 */
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateCoupon, recordCouponUse } from '@/lib/actions/admin';

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  starter: { amount: 19900, name: 'Starter Plan' },   // paise (₹199)
  pro:     { amount: 59900, name: 'Pro Plan' },       // paise (₹599)
  premium: { amount: 129900, name: 'Premium Plan' },  // paise (₹1299)
};

export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay payment keys are not configured. Please contact support or update API keys in admin settings.' },
        { status: 503 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    // Verify auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, coupon_code, billing_cycle = 'monthly' } = await request.json();
    const targetSlug = (plan || '').toLowerCase().trim();

    // 1. Dynamic Plan Lookup from Database
    const adminClient = createAdminClient();
    const { data: dbPlan } = await adminClient
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .or(`slug.eq.${targetSlug},id.eq.${targetSlug}`)
      .maybeSingle();

    let planName = dbPlan?.name;
    let baseAmountPaise = 0;

    if (dbPlan) {
      const priceRupees = billing_cycle === 'annual' || billing_cycle === 'yearly'
        ? (dbPlan.price_yearly || dbPlan.price_monthly * 10)
        : dbPlan.price_monthly;
      baseAmountPaise = Math.round(Number(priceRupees || 0) * 100);
    } else {
      const fallback = PLAN_PRICES[targetSlug];
      if (fallback) {
        planName = fallback.name;
        baseAmountPaise = fallback.amount;
      }
    }

    if (!planName || baseAmountPaise <= 0) {
      return NextResponse.json({ error: 'Invalid or inactive plan selected' }, { status: 400 });
    }

    let finalAmount = baseAmountPaise;
    let appliedCoupon: string | null = null;
    let discountPercent = 0;

    if (coupon_code) {
      const validation = await validateCoupon(coupon_code);
      if (validation.valid && validation.discount_percent) {
        discountPercent = validation.discount_percent;
        appliedCoupon = validation.code || coupon_code.toUpperCase();
        const discountPaise = Math.round(baseAmountPaise * (discountPercent / 100));
        // Minimum ₹1 (100 paise) for Razorpay transaction processing
        finalAmount = Math.max(100, baseAmountPaise - discountPaise);
        if (appliedCoupon) {
          await recordCouponUse(appliedCoupon);
        }
      }
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt: `order_${user.id}_${targetSlug}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan: targetSlug,
        plan_id: dbPlan?.id || targetSlug,
        user_email: user.email || '',
        coupon_applied: appliedCoupon || 'none',
        discount_percent: discountPercent.toString(),
        original_amount: (baseAmountPaise / 100).toString(),
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan: targetSlug,
      plan_name: planName,
      original_amount: baseAmountPaise,
      discount_percent: discountPercent,
      coupon_applied: appliedCoupon,
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

