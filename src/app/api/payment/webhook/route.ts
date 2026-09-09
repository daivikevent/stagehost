/**
 * Razorpay Webhook Handler
 * POST /api/payment/webhook
 * Called by Razorpay after payment success/failure.
 * Verifies signature, then upgrades user plan in Supabase.
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

const PLAN_LIMITS: Record<string, {
  plan_name: string;
  max_videos: number;
  max_photos: number;
  max_services: number;
  has_analytics: boolean;
  has_custom_domain: boolean;
  max_themes: number;
  show_branding: boolean;
}> = {
  starter: {
    plan_name: 'Starter',
    max_videos: 10,
    max_photos: 20,
    max_services: 10,
    has_analytics: false,
    has_custom_domain: false,
    max_themes: 3,
    show_branding: false,
  },
  pro: {
    plan_name: 'Pro',
    max_videos: 30,
    max_photos: 60,
    max_services: -1,
    has_analytics: true,
    has_custom_domain: false,
    max_themes: 5,
    show_branding: false,
  },
  premium: {
    plan_name: 'Premium',
    max_videos: -1,
    max_photos: -1,
    max_services: -1,
    has_analytics: true,
    has_custom_domain: true,
    max_themes: -1,
    show_branding: false,
  },
};

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  // Verify webhook signature
  if (!verifySignature(body, signature)) {
    console.error('Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = createAdminClient(); // Admin client — bypasses RLS

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const { user_id, plan, plan_id } = payment.notes || {};
    const targetSlug = (plan || '').toLowerCase().trim();

    // Query DB plans table dynamically
    const { data: dbPlan } = await supabase
      .from('plans')
      .select('*')
      .or(`slug.eq.${targetSlug},id.eq.${plan_id || targetSlug}`)
      .maybeSingle();

    const fallbackConfig = PLAN_LIMITS[targetSlug] || PLAN_LIMITS['starter'];
    const planName = dbPlan?.name || fallbackConfig?.plan_name || 'StageHost Plan';
    const limits = (dbPlan?.limits && typeof dbPlan.limits === 'object') ? dbPlan.limits : {};

    const max_videos = limits.max_videos !== undefined ? limits.max_videos : fallbackConfig?.max_videos ?? 15;
    const max_photos = limits.max_photos !== undefined ? limits.max_photos : fallbackConfig?.max_photos ?? 30;
    const max_services = limits.max_services !== undefined ? limits.max_services : fallbackConfig?.max_services ?? -1;
    const has_analytics = limits.analytics_dashboard !== undefined ? Boolean(limits.analytics_dashboard) : (fallbackConfig?.has_analytics ?? true);
    const has_custom_domain = limits.custom_domain !== undefined ? Boolean(limits.custom_domain) : (fallbackConfig?.has_custom_domain ?? false);
    const max_themes = limits.max_themes !== undefined ? limits.max_themes : (fallbackConfig?.max_themes ?? 5);
    const show_branding = limits.show_branding !== undefined ? limits.show_branding : (fallbackConfig?.show_branding ?? false);

    if (!user_id) {
      return NextResponse.json({ error: 'Invalid payment notes — user_id missing' }, { status: 400 });
    }

    try {
      // 1. Record payment
      await supabase.from('payments').insert({
        user_id,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount: payment.amount / 100, // convert paise to rupees
        currency: payment.currency,
        plan_name: planName,
        status: 'success',
      });

      // 2. Upsert subscription
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      await supabase.from('subscriptions').upsert({
        user_id,
        plan_name: planName,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: nextBillingDate.toISOString(),
        razorpay_payment_id: payment.id,
        max_videos,
        max_photos,
        max_services,
        has_analytics,
        has_custom_domain,
        max_themes,
        show_branding,
      }, { onConflict: 'user_id' });

      console.log(`✅ Plan upgraded dynamically: ${user_id} → ${planName}`);
    } catch (err) {
      console.error('Failed to update subscription:', err);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }
  }

  if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity;
    const { user_id, plan } = payment.notes;

    await supabase.from('payments').insert({
      user_id,
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      amount: payment.amount / 100,
      currency: payment.currency,
      plan_name: plan,
      status: 'failed',
    }).throwOnError();
  }

  return NextResponse.json({ received: true });
}
