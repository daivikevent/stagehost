'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export interface PublicPlan {
  id: string;
  name: string;
  slug: string;
  tier: number;
  price_monthly: number;
  price_yearly: number;
  strike_price?: number;
  period_text?: string;
  description: string;
  features: string[];
  popular: boolean;
  limits: Record<string, any>;
  cta: string;
  href: string;
}

/**
 * Fetch active plans directly from Supabase database for public display
 * (Homepage, Pricing page, etc.)
 */
export async function getPublicPlans(): Promise<PublicPlan[]> {
  try {
    const adminClient = createAdminClient();
    const { data: plans, error } = await adminClient
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true });

    if (error || !plans || plans.length === 0) {
      return getFallbackPlans();
    }

    return plans.map((p) => {
      // Build dynamic features based on current limits and features stored in DB
      let features: string[] = Array.isArray(p.features) && p.features.length > 0 ? [...p.features] : [];

      if (features.length === 0) {
        const videoText = p.limits?.max_videos === -1 ? 'Unlimited showreel videos' : `${p.limits?.max_videos ?? 5} showreel videos`;
        const photoText = p.limits?.max_photos === -1 ? 'Unlimited photo gallery' : `${p.limits?.max_photos ?? 10} photos`;
        const servicesText = p.limits?.max_service_packages === -1 ? 'Unlimited service packages' : `${p.limits?.max_service_packages ?? 3} service packages`;

        features = [
          videoText,
          photoText,
          servicesText,
          'Direct WhatsApp booking button',
          'Verified client reviews system',
          'StageHost Directory listing',
          'Zero booking commissions',
        ];

        if (p.limits?.verified_badge) features.push('Verified Artist Blue Tick Badge');
        if (p.limits?.analytics_dashboard) features.push('Advanced visitor & lead analytics');
        if (p.limits?.custom_domain) features.push('Custom domain connection (yourname.com)');
        if (p.limits?.remove_branding_footer) features.push('Zero StageHost footer branding');
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        tier: p.tier,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly || p.price_monthly * 10,
        strike_price: p.limits?.strike_price ? Number(p.limits.strike_price) : undefined,
        period_text: p.limits?.period_text || (p.price_monthly === 0 ? 'forever' : undefined),
        description: p.description || (p.price_monthly === 0 ? 'Perfect to get started' : 'For professional event hosts'),
        features,
        popular: !!p.is_popular,
        limits: p.limits || {},
        cta: p.price_monthly === 0 ? 'Start Free' : p.slug === 'pro' ? 'Upgrade to Pro' : `Get ${p.name}`,
        href: p.price_monthly === 0 ? '/register' : `/register?plan=${p.slug}`,
      };
    });
  } catch (err) {
    console.error('Error fetching public plans:', err);
    return getFallbackPlans();
  }
}

function getFallbackPlans(): PublicPlan[] {
  return [
    {
      id: 'free',
      name: 'Free',
      slug: 'free',
      tier: 0,
      price_monthly: 0,
      price_yearly: 0,
      description: 'Perfect to get started',
      features: [
        '5 video showcases',
        '10 photo gallery',
        '3 service packages',
        'Basic calendar',
        'Inquiry form',
        'WhatsApp button',
        'Directory listing',
        'StageHost subdomain',
      ],
      popular: false,
      limits: { max_videos: 5, max_photos: 10, max_service_packages: 3 },
      cta: 'Start Free',
      href: '/register',
    },
    {
      id: 'starter',
      name: 'Starter',
      slug: 'starter',
      tier: 1,
      price_monthly: 199,
      price_yearly: 1999,
      description: 'For growing anchors',
      features: [
        '15 video showcases',
        '30 photo gallery',
        '5 service packages',
        'Lead tracking',
        'Remove footer branding',
        'Basic analytics',
        '3 theme choices',
        'Priority support',
      ],
      popular: false,
      limits: { max_videos: 15, max_photos: 30, max_service_packages: 5 },
      cta: 'Upgrade to Starter',
      href: '/register?plan=starter',
    },
    {
      id: 'pro',
      name: 'Pro',
      slug: 'pro',
      tier: 2,
      price_monthly: 599,
      price_yearly: 5999,
      description: 'For serious professionals',
      features: [
        'Unlimited videos & photos',
        'Unlimited packages',
        'Google Drive integration',
        'Travel buffer scheduling',
        'Advanced analytics',
        'All themes unlocked',
        'SEO tools',
        'Priority directory listing',
      ],
      popular: true,
      limits: { max_videos: -1, max_photos: -1, max_service_packages: -1 },
      cta: 'Go Pro',
      href: '/register?plan=pro',
    },
    {
      id: 'premium',
      name: 'Premium',
      slug: 'premium',
      tier: 3,
      price_monthly: 1299,
      price_yearly: 12999,
      description: 'For top-tier anchors',
      features: [
        'Everything in Pro',
        'Custom domain connection',
        'White-label (no branding)',
        'Featured in directory',
        'Invoice generation',
        'Google Calendar sync',
        'Custom brand colors',
        'Dedicated VIP support',
      ],
      popular: false,
      limits: { max_videos: -1, max_photos: -1, max_service_packages: -1, custom_domain: true },
      cta: 'Get Premium',
      href: '/register?plan=premium',
    },
  ];
}
