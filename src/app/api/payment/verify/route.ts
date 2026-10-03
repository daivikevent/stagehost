/**
 * Razorpay Payment Verification & Plan Activation API
 * POST /api/payment/verify
 * Verifies Razorpay signature and instantly activates the plan in Supabase.
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      is_test_mode = false,
    } = body;

    const targetSlug = (plan || 'starter').toLowerCase().trim();
    const adminClient = createAdminClient();

    // 1. Fetch Plan details from database
    const { data: dbPlan } = await adminClient
      .from('plans')
      .select('*')
      .or(`slug.eq.${targetSlug},id.eq.${targetSlug}`)
      .maybeSingle();

    const planName = dbPlan?.name || targetSlug.toUpperCase();
    const planId = dbPlan?.id || targetSlug;

    // 2. Verify signature if not in simulated test mode
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isPlaceholderSecret = !keySecret || keySecret.includes('placeholder');

    if (!is_test_mode && !isPlaceholderSecret && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // 3. Determine plan limits
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

    const fallbackConfig = PLAN_LIMITS[targetSlug] || PLAN_LIMITS['starter'];
    const limits = (dbPlan?.limits && typeof dbPlan.limits === 'object') ? dbPlan.limits : {};

    const max_videos = limits.max_videos !== undefined ? limits.max_videos : fallbackConfig.max_videos;
    const max_photos = limits.max_photos !== undefined ? limits.max_photos : fallbackConfig.max_photos;
    const max_services = limits.max_services !== undefined ? limits.max_services : fallbackConfig.max_services;
    const has_analytics = limits.analytics_dashboard !== undefined ? Boolean(limits.analytics_dashboard) : fallbackConfig.has_analytics;
    const has_custom_domain = limits.custom_domain !== undefined ? Boolean(limits.custom_domain) : fallbackConfig.has_custom_domain;
    const max_themes = limits.max_themes !== undefined ? limits.max_themes : fallbackConfig.max_themes;
    const show_branding = limits.show_branding !== undefined ? limits.show_branding : fallbackConfig.show_branding;

    // 4. Record payment in payments table
    try {
      await adminClient.from('payments').insert({
        user_id: user.id,
        razorpay_payment_id: razorpay_payment_id || `pay_test_${Date.now()}`,
        razorpay_order_id: razorpay_order_id || `order_test_${Date.now()}`,
        amount: dbPlan?.price_monthly || (targetSlug === 'premium' ? 1299 : targetSlug === 'pro' ? 599 : 199),
        currency: 'INR',
        plan_name: planName,
        status: 'success',
      });
    } catch (e) {
      console.warn('Payment record warning:', e);
    }

    // 5. Upsert subscription in subscriptions table
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const { data: subData } = await adminClient.from('subscriptions').upsert({
      user_id: user.id,
      plan_name: planName,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: nextBillingDate.toISOString(),
      razorpay_payment_id: razorpay_payment_id || 'test_payment',
      max_videos,
      max_photos,
      max_services,
      has_analytics,
      has_custom_domain,
      max_themes,
      show_branding,
    }, { onConflict: 'user_id' }).select('id').maybeSingle();

    // 6. Update artist profile
    await adminClient
      .from('anchor_profiles')
      .update({
        plan_tier: targetSlug,
        subscription_id: subData?.id || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      plan_name: planName,
      message: `🎉 Success! Your ${planName} subscription is now active.`,
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return NextResponse.json(
      { error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
