/**
 * Razorpay Order Creation API
 * POST /api/payment/create-order
 * Creates a Razorpay order for a plan upgrade.
 * Supports both Live/Test Razorpay Keys and Sandbox Simulation Mode.
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
    const adminClient = createAdminClient();

    // Verify auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve Keys (env or platform_settings)
    let keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    let keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || keyId.includes('placeholder')) {
      const { data: dbKeyId } = await adminClient
        .from('platform_settings')
        .select('value')
        .eq('key', 'razorpay_key_id')
        .maybeSingle();
      if (dbKeyId?.value && !dbKeyId.value.includes('placeholder')) {
        keyId = dbKeyId.value;
      }
    }

    if (!keySecret || keySecret.includes('placeholder')) {
      const { data: dbKeySecret } = await adminClient
        .from('platform_settings')
        .select('value')
        .eq('key', 'razorpay_key_secret')
        .maybeSingle();
      if (dbKeySecret?.value && !dbKeySecret.value.includes('placeholder')) {
        keySecret = dbKeySecret.value;
      }
    }

    const isTestMode = !keyId || keyId.includes('placeholder') || !keySecret || keySecret.includes('placeholder');

    const { plan, coupon_code, billing_cycle = 'monthly' } = await request.json();
    const targetSlug = (plan || 'starter').toLowerCase().trim();

    // 1. Dynamic Plan Lookup from Database
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

    // 2. If sandbox test mode, generate test order
    if (isTestMode) {
      const mockOrderId = `order_test_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      return NextResponse.json({
        order_id: mockOrderId,
        amount: finalAmount,
        currency: 'INR',
        key: keyId || 'rzp_test_placeholder',
        plan: targetSlug,
        plan_name: planName,
        original_amount: baseAmountPaise,
        discount_percent: discountPercent,
        coupon_applied: appliedCoupon,
        is_test_mode: true,
      });
    }

    // 3. Create real Razorpay order with active credentials
    const razorpay = new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    });

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
      key: keyId,
      plan: targetSlug,
      plan_name: planName,
      original_amount: baseAmountPaise,
      discount_percent: discountPercent,
      coupon_applied: appliedCoupon,
      is_test_mode: false,
    });
  } catch (err: any) {
    console.error('Razorpay order error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
