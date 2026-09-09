'use client';

import { useState } from 'react';
import { CreditCard, Loader2, Sparkles, Tag, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { validateCoupon } from '@/lib/actions/admin';

// Razorpay script loader
function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && (window as Window & { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const DEFAULT_PLAN_PRICES: Record<string, number> = {
  starter: 199,
  pro: 599,
  premium: 1299,
};

interface CheckoutButtonProps {
  plan: 'starter' | 'pro' | 'premium';
  planName: string;
  price?: number;
  className?: string;
  children?: React.ReactNode;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
}

export function CheckoutButton({
  plan,
  planName,
  price,
  className,
  children,
  userEmail,
  userName,
  userPhone,
}: CheckoutButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();
  const router = useRouter();

  const basePrice = price || DEFAULT_PLAN_PRICES[plan] || 599;
  const discountAmount = appliedCoupon ? Math.round(basePrice * (appliedCoupon.discountPercent / 100)) : 0;
  const finalPrice = Math.max(1, basePrice - discountAmount);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await validateCoupon(clean);
      if (res.valid && res.discount_percent) {
        setAppliedCoupon({
          code: res.code || clean,
          discountPercent: res.discount_percent,
          message: res.message || `${res.discount_percent}% off applied!`,
        });
        setCouponError(null);
      } else {
        setCouponError(res.message || 'Invalid promo code');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Failed to validate promo code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleProceedToPayment = async () => {
    setLoading(true);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        showError('Razorpay failed to load. Check your internet connection.');
        setLoading(false);
        return;
      }

      // 2. Create order on server with coupon if applied
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        showError(error || 'Failed to create order');
        setLoading(false);
        return;
      }

      const orderData = await res.json();

      // 3. Open Razorpay checkout
      const RazorpayConstructor = (window as unknown as { Razorpay: new (options: RazorpayOptions) => RazorpayInstance }).Razorpay;
      const rzp = new RazorpayConstructor({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'StageHost',
        description: `${planName} — Monthly Subscription${appliedCoupon ? ` (${appliedCoupon.code})` : ''}`,
        order_id: orderData.order_id,
        prefill: {
          email: userEmail || '',
          name: userName || '',
          contact: userPhone || '',
        },
        theme: {
          color: '#6C5CE7',
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: () => {
          setIsModalOpen(false);
          success(`🎉 Welcome to ${planName}! Your plan is now active.`);
          router.push('/settings?upgraded=true');
        },
      });

      rzp.open();
    } catch {
      showError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={className || 'btn btn-primary btn-block'}
        onClick={() => setIsModalOpen(true)}
      >
        {children || <><CreditCard size={16} /> Upgrade to {planName}</>}
      </button>

      {/* Interactive Checkout Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 'var(--space-4)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: 'var(--space-5)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>
                  Upgrade to {planName}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0, marginTop: 4 }}>
                  Monthly billing · Cancel anytime
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Plan Summary Card */}
              <div
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    {planName} Plan
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                    Standard Monthly Rate
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
                    ₹{basePrice}
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--color-text-tertiary)' }}>/mo</span>
                  </div>
                </div>
              </div>

              {/* Coupon / Promo Box */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  <Tag size={13} color="var(--color-accent)" /> Have a Promo Code?
                </label>
                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. EARLYBIRD50"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 'var(--text-sm)' }}
                      disabled={validatingCoupon || loading}
                    />
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      disabled={!couponCode.trim() || validatingCoupon || loading}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {validatingCoupon ? <Loader2 size={14} className="spin" /> : 'Apply'}
                    </button>
                  </form>
                ) : (
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color="var(--color-success)" />
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)' }}>
                          PROMO "{appliedCoupon.code}" APPLIED
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          {appliedCoupon.discountPercent}% Discount (-₹{discountAmount})
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-tertiary)',
                        fontSize: 'var(--text-xs)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-error)',
                      marginTop: 6,
                    }}
                  >
                    <AlertCircle size={13} /> {couponError}
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 'var(--text-xs)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                  <span>Plan Subtotal</span>
                  <span>₹{basePrice}</span>
                </div>
                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
                    <span>Discount ({appliedCoupon.discountPercent}%)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 6,
                    marginTop: 2,
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <span>Total Payable</span>
                  <span style={{ color: appliedCoupon ? 'var(--color-success)' : 'var(--color-primary)' }}>
                    ₹{finalPrice}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={14} color="var(--color-success)" />
                256-bit encrypted checkout via Razorpay · Instant activation
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                padding: 'var(--space-4) var(--space-5)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: 'var(--space-3)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleProceedToPayment}
                disabled={loading}
                style={{ flex: 2 }}
              >
                {loading ? (
                  <><Loader2 size={16} className="spin" /> Opening Checkout...</>
                ) : (
                  <><CreditCard size={16} /> Pay ₹{finalPrice} with Razorpay</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { email?: string; name?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler?: (response: RazorpayResponse) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

