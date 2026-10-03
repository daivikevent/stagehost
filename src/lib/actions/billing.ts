'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from './admin';
import { numberToIndianWords } from '@/lib/number-to-words';
import {
  ArtistBillingDetails,
  PlatformCompanyDetails,
  DEFAULT_PLATFORM_COMPANY,
  TaxInvoice,
  INDIAN_STATES,
} from '@/types/invoice';

/**
 * Fetch company's registered GST & Legal details from platform_settings
 */
export async function getPlatformCompanyTaxDetails(): Promise<PlatformCompanyDetails> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('platform_settings')
      .select('key, value')
      .in('key', [
        'company_legal_name',
        'company_trade_name',
        'company_gstin',
        'company_pan',
        'company_address',
        'company_city',
        'company_state',
        'company_state_code',
        'company_pincode',
        'company_billing_email',
        'company_invoice_prefix',
        'company_sac_code',
      ]);

    if (data && data.length > 0) {
      const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
      return {
        legalName: map.company_legal_name || DEFAULT_PLATFORM_COMPANY.legalName,
        tradeName: map.company_trade_name || DEFAULT_PLATFORM_COMPANY.tradeName,
        gstin: map.company_gstin || DEFAULT_PLATFORM_COMPANY.gstin,
        pan: map.company_pan || DEFAULT_PLATFORM_COMPANY.pan,
        address: map.company_address || DEFAULT_PLATFORM_COMPANY.address,
        city: map.company_city || DEFAULT_PLATFORM_COMPANY.city,
        state: map.company_state || DEFAULT_PLATFORM_COMPANY.state,
        stateCode: map.company_state_code || DEFAULT_PLATFORM_COMPANY.stateCode,
        pincode: map.company_pincode || DEFAULT_PLATFORM_COMPANY.pincode,
        email: map.company_billing_email || DEFAULT_PLATFORM_COMPANY.email,
        website: DEFAULT_PLATFORM_COMPANY.website,
        invoicePrefix: map.company_invoice_prefix || DEFAULT_PLATFORM_COMPANY.invoicePrefix,
        sacCode: map.company_sac_code || DEFAULT_PLATFORM_COMPANY.sacCode,
      };
    }
  } catch (err) {
    console.error('Error fetching platform tax details:', err);
  }

  return DEFAULT_PLATFORM_COMPANY;
}

/**
 * Admin action: Save platform company GST & tax settings
 */
export async function savePlatformCompanyTaxDetails(details: Partial<PlatformCompanyDetails>) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const entries = [
    { key: 'company_legal_name', value: details.legalName || DEFAULT_PLATFORM_COMPANY.legalName },
    { key: 'company_trade_name', value: details.tradeName || DEFAULT_PLATFORM_COMPANY.tradeName },
    { key: 'company_gstin', value: (details.gstin || DEFAULT_PLATFORM_COMPANY.gstin).toUpperCase() },
    { key: 'company_pan', value: (details.pan || DEFAULT_PLATFORM_COMPANY.pan).toUpperCase() },
    { key: 'company_address', value: details.address || DEFAULT_PLATFORM_COMPANY.address },
    { key: 'company_city', value: details.city || DEFAULT_PLATFORM_COMPANY.city },
    { key: 'company_state', value: details.state || DEFAULT_PLATFORM_COMPANY.state },
    { key: 'company_state_code', value: details.stateCode || DEFAULT_PLATFORM_COMPANY.stateCode },
    { key: 'company_pincode', value: details.pincode || DEFAULT_PLATFORM_COMPANY.pincode },
    { key: 'company_billing_email', value: details.email || DEFAULT_PLATFORM_COMPANY.email },
    { key: 'company_invoice_prefix', value: details.invoicePrefix || DEFAULT_PLATFORM_COMPANY.invoicePrefix },
    { key: 'company_sac_code', value: details.sacCode || DEFAULT_PLATFORM_COMPANY.sacCode },
  ].map((e) => ({ ...e, updated_at: new Date().toISOString() }));

  for (const entry of entries) {
    await adminClient.from('platform_settings').upsert(entry, { onConflict: 'key' });
  }

  revalidatePath('/admin/settings');
  return { success: true };
}

/**
 * Fetch authenticated artist's business & GST billing profile
 */
export async function getArtistBillingDetails(): Promise<ArtistBillingDetails | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', `billing_profile_${user.id}`)
      .maybeSingle();

    if (data?.value) {
      return JSON.parse(data.value);
    }
  } catch (err) {
    console.error('Error fetching artist billing details:', err);
  }

  // Fallback defaults from profile
  try {
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('anchor_profiles')
      .select('name, city, state')
      .eq('user_id', user.id)
      .maybeSingle();

    const stateObj = INDIAN_STATES.find((s) => s.name.toLowerCase() === (profile?.state || '').toLowerCase());

    return {
      businessName: profile?.name || '',
      gstin: '',
      pan: '',
      billingAddress: profile?.city ? `${profile.city}, ${profile.state || 'India'}` : '',
      city: profile?.city || 'Mumbai',
      state: profile?.state || 'Maharashtra',
      stateCode: stateObj?.code || '27',
      pincode: '400001',
    };
  } catch {}

  return null;
}

/**
 * Save artist's business & GST billing details
 */
export async function saveArtistBillingDetails(details: ArtistBillingDetails) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Basic GSTIN format validation if supplied
  if (details.gstin && details.gstin.trim()) {
    const cleanGst = details.gstin.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(cleanGst)) {
      throw new Error('Invalid GSTIN format. A valid Indian GSTIN must be 15 characters (e.g. 27ABCDE1234F1Z5).');
    }
    details.gstin = cleanGst;
    // Auto-sync state code from first 2 digits of GSTIN
    const prefixCode = cleanGst.slice(0, 2);
    const matchedState = INDIAN_STATES.find((s) => s.code === prefixCode);
    if (matchedState) {
      details.state = matchedState.name;
      details.stateCode = matchedState.code;
    }
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('platform_settings').upsert({
    key: `billing_profile_${user.id}`,
    value: JSON.stringify(details),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Fetch all payments and generate formal GST Tax Invoices for the authenticated artist
 */
export async function getMyPaymentInvoices(): Promise<TaxInvoice[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [company, billing, profileRes] = await Promise.all([
    getPlatformCompanyTaxDetails(),
    getArtistBillingDetails(),
    supabase.from('anchor_profiles').select('name, email, phone, city, state').eq('user_id', user.id).maybeSingle(),
  ]);

  const profile = profileRes.data;
  const adminClient = createAdminClient();

  const { data: payments } = await adminClient
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // If user has payments, map them to Tax Invoices
  if (payments && payments.length > 0) {
    return payments.map((p, index) => {
      const totalAmount = Number(p.amount) || 599;
      // Tax calculation (inclusive 18% GST)
      const taxable = Math.round((totalAmount / 1.18) * 100) / 100;
      const totalTax = Math.round((totalAmount - taxable) * 100) / 100;

      const customerStateCode = billing?.stateCode || (INDIAN_STATES.find((s) => s.name.toLowerCase() === (profile?.state || '').toLowerCase())?.code || '27');
      const isIntraState = customerStateCode === company.stateCode;

      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      if (isIntraState) {
        cgstRate = 9;
        cgstAmount = Math.round((totalTax / 2) * 100) / 100;
        sgstRate = 9;
        sgstAmount = Math.round((totalTax / 2) * 100) / 100;
      } else {
        igstRate = 18;
        igstAmount = totalTax;
      }

      const invoiceNumFormatted = `${company.invoicePrefix}${String(1000 + (payments.length - index)).padStart(5, '0')}`;
      const planTitle = p.plan_name || 'Pro Plan';

      return {
        id: p.id || p.razorpay_payment_id || `inv_${index}`,
        invoiceNumber: invoiceNumFormatted,
        invoiceDate: new Date(p.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        billingPeriod: '1 Month Subscription',
        placeOfSupply: `${billing?.state || profile?.state || company.state} (${customerStateCode})`,
        isB2B: Boolean(billing?.gstin),
        supplier: company,
        customer: {
          name: profile?.name || 'Valued Artist',
          businessName: billing?.businessName || profile?.name || 'Valued Artist',
          email: profile?.email || user.email || '',
          phone: profile?.phone || '',
          gstin: billing?.gstin || undefined,
          pan: billing?.pan || undefined,
          address: billing?.billingAddress || `${profile?.city || 'Mumbai'}, ${profile?.state || 'Maharashtra'}`,
          city: billing?.city || profile?.city || 'Mumbai',
          state: billing?.state || profile?.state || 'Maharashtra',
          stateCode: customerStateCode,
          pincode: billing?.pincode || '400001',
        },
        items: [
          {
            id: 'item-1',
            description: `BookMyArtist ${planTitle} - Cloud Portfolio & Booking Infrastructure Subscription`,
            sacCode: company.sacCode,
            taxableAmount: taxable,
            cgstRate,
            cgstAmount,
            sgstRate,
            sgstAmount,
            igstRate,
            igstAmount,
            totalAmount,
          },
        ],
        subtotalTaxable: taxable,
        totalCgst: cgstAmount,
        totalSgst: sgstAmount,
        totalIgst: igstAmount,
        totalTax,
        totalAmount,
        amountInWords: numberToIndianWords(totalAmount),
        paymentDetails: {
          paymentId: p.razorpay_payment_id || 'pay_online_success',
          orderId: p.razorpay_order_id || 'order_bma_verified',
          mode: 'UPI / NetBanking / Razorpay',
          date: new Date(p.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'PAID',
        },
      };
    });
  }

  // If user is on an active plan (e.g. Pro or Premium) but no row in payments yet, provide active plan receipt
  const { data: sub } = await adminClient
    .from('subscriptions')
    .select('plan_name, current_period_start, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  if (sub && sub.plan_name && sub.plan_name.toLowerCase() !== 'free') {
    const totalAmount = sub.plan_name.toLowerCase().includes('premium') ? 1299 : 599;
    const taxable = Math.round((totalAmount / 1.18) * 100) / 100;
    const totalTax = Math.round((totalAmount - taxable) * 100) / 100;
    const customerStateCode = billing?.stateCode || '27';
    const isIntraState = customerStateCode === company.stateCode;

    return [
      {
        id: 'active_sub_inv',
        invoiceNumber: `${company.invoicePrefix}01001`,
        invoiceDate: new Date(sub.current_period_start || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        billingPeriod: 'Active Monthly Subscription',
        placeOfSupply: `${billing?.state || 'Maharashtra'} (${customerStateCode})`,
        isB2B: Boolean(billing?.gstin),
        supplier: company,
        customer: {
          name: profile?.name || 'Valued Artist',
          businessName: billing?.businessName || profile?.name || 'Valued Artist',
          email: profile?.email || user.email || '',
          phone: profile?.phone || '',
          gstin: billing?.gstin || undefined,
          pan: billing?.pan || undefined,
          address: billing?.billingAddress || 'India',
          city: billing?.city || 'Mumbai',
          state: billing?.state || 'Maharashtra',
          stateCode: customerStateCode,
          pincode: billing?.pincode || '400001',
        },
        items: [
          {
            id: 'item-active',
            description: `BookMyArtist ${sub.plan_name} - Cloud Portfolio & Booking Infrastructure Subscription`,
            sacCode: company.sacCode,
            taxableAmount: taxable,
            cgstRate: isIntraState ? 9 : 0,
            cgstAmount: isIntraState ? Math.round((totalTax / 2) * 100) / 100 : 0,
            sgstRate: isIntraState ? 9 : 0,
            sgstAmount: isIntraState ? Math.round((totalTax / 2) * 100) / 100 : 0,
            igstRate: !isIntraState ? 18 : 0,
            igstAmount: !isIntraState ? totalTax : 0,
            totalAmount,
          },
        ],
        subtotalTaxable: taxable,
        totalCgst: isIntraState ? Math.round((totalTax / 2) * 100) / 100 : 0,
        totalSgst: isIntraState ? Math.round((totalTax / 2) * 100) / 100 : 0,
        totalIgst: !isIntraState ? totalTax : 0,
        totalTax,
        totalAmount,
        amountInWords: numberToIndianWords(totalAmount),
        paymentDetails: {
          paymentId: 'pay_activated_membership',
          orderId: 'order_active_cycle',
          mode: 'UPI AutoPay / Razorpay',
          date: new Date(sub.current_period_start || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'PAID',
        },
      },
    ];
  }

  return [];
}
