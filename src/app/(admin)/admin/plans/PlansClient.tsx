'use client';

import { useState, useTransition } from 'react';
import {
  Edit2,
  Crown,
  Save,
  Loader2,
  X,
  Tag,
  Plus,
  Trash2,
  AlertTriangle,
  BadgeCheck,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  savePlatformSettings,
  updateAdminPlan,
  createAdminPlan,
  deleteAdminPlan,
  createCoupon,
  deleteCoupon,
  toggleCouponStatus,
} from '@/lib/actions/admin';
import type { Coupon } from '@/types';
import styles from '../dashboard/admin.module.css';

export interface PlanConfig {
  id: string;
  name: string;
  slug: string;
  price: number;
  price_yearly?: number;
  strike_price?: number;
  period_text?: string;
  description?: string;
  tier?: number;
  is_active?: boolean;
  is_popular?: boolean;
  videos: number;
  photos: number;
  services: number;
  analytics: boolean;
  custom_domain: boolean;
  verified_badge?: boolean;
  themes: number;
  branding: boolean;
}

interface PlansClientProps {
  initialPlans: PlanConfig[];
  initialCoupons?: Coupon[];
}

const defaultNewPlanState = {
  name: '',
  slug: '',
  description: '',
  price_monthly: 499,
  price_yearly: 4999,
  strike_price: '',
  period_text: '',
  videos: 20,
  photos: 40,
  services: 8,
  analytics: true,
  custom_domain: false,
  verified_badge: true,
  branding: false,
  is_popular: false,
};

export function PlansClient({ initialPlans, initialCoupons = [] }: PlansClientProps) {
  const { success, error: showError } = useToast();
  const [plans, setPlans] = useState<PlanConfig[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create Plan State
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState(defaultNewPlanState);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Delete Plan State
  const [planToDelete, setPlanToDelete] = useState<PlanConfig | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  // Razorpay keys state
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Coupon state
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_percent: 20,
    valid_until: '',
    max_uses: '',
  });
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  const handlePlanNameChange = (val: string) => {
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setNewPlanForm((prev) => ({
      ...prev,
      name: val,
      slug:
        prev.slug === '' ||
        prev.slug ===
          prev.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
          ? generatedSlug
          : prev.slug,
    }));
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanForm.name.trim()) {
      showError('Please enter a plan name');
      return;
    }

    setIsSavingPlan(true);
    try {
      const res = await createAdminPlan({
        name: newPlanForm.name.trim(),
        slug: newPlanForm.slug.trim(),
        description: newPlanForm.description.trim(),
        price_monthly: Number(newPlanForm.price_monthly),
        price_yearly: Number(newPlanForm.price_yearly),
        strike_price: newPlanForm.strike_price ? Number(newPlanForm.strike_price) : undefined,
        period_text: newPlanForm.period_text.trim() || undefined,
        videos: Number(newPlanForm.videos),
        photos: Number(newPlanForm.photos),
        services: Number(newPlanForm.services),
        analytics: newPlanForm.analytics,
        custom_domain: newPlanForm.custom_domain,
        verified_badge: newPlanForm.verified_badge,
        branding: newPlanForm.branding,
        is_popular: newPlanForm.is_popular,
      });

      if (res.plan) {
        setPlans((prev) => [...prev, res.plan]);
      }
      success(`Plan "${newPlanForm.name}" created and published!`);
      setIsCreatingPlan(false);
      setNewPlanForm(defaultNewPlanState);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleTogglePlanActive = async (plan: PlanConfig) => {
    const newActiveState = plan.is_active === false ? true : false;
    // Optimistic UI update
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, is_active: newActiveState } : p))
    );

    try {
      await updateAdminPlan(plan.id, {
        price: plan.price,
        price_yearly: plan.price_yearly,
        strike_price: plan.strike_price,
        period_text: plan.period_text,
        videos: plan.videos,
        photos: plan.photos,
        services: plan.services,
        themes: plan.themes,
        analytics: plan.analytics,
        custom_domain: plan.custom_domain,
        verified_badge: plan.verified_badge,
        branding: plan.branding,
        is_popular: plan.is_popular,
        is_active: newActiveState,
      });
      success(
        newActiveState
          ? `Plan "${plan.name}" is now Active and visible publicly!`
          : `Plan "${plan.name}" is now OFF (Hidden from Home & Pricing pages)!`
      );
    } catch (err) {
      // Revert optimistic update
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: plan.is_active } : p))
      );
      showError(err instanceof Error ? err.message : 'Failed to update plan status');
    }
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    if (planToDelete.slug === 'free') {
      showError('The default Free plan cannot be deleted.');
      return;
    }

    setIsDeletingPlan(true);
    try {
      const res = await deleteAdminPlan(planToDelete.id);
      if (res.deactivated) {
        setPlans((prev) =>
          prev.map((p) => (p.id === planToDelete.id ? { ...p, is_active: false } : p))
        );
        success(res.message);
      } else {
        setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id));
        success(res.message);
      }
      if (editingPlan?.id === planToDelete.id) {
        setEditingPlan(null);
      }
      setPlanToDelete(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete plan');
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const handleSavePlanLimits = (e?: React.FormEvent, explicitPlan?: PlanConfig) => {
    if (e) e.preventDefault();
    const planToSave = explicitPlan || editingPlan;
    if (!planToSave) return;

    startTransition(async () => {
      try {
        await updateAdminPlan(planToSave.id, {
          name: planToSave.name,
          description: planToSave.description,
          price: planToSave.price,
          price_yearly: planToSave.price_yearly,
          strike_price: planToSave.strike_price ? Number(planToSave.strike_price) : undefined,
          period_text: planToSave.period_text,
          videos: planToSave.videos,
          photos: planToSave.photos,
          services: planToSave.services,
          themes: planToSave.themes,
          analytics: planToSave.analytics,
          custom_domain: planToSave.custom_domain,
          verified_badge: planToSave.verified_badge,
          branding: planToSave.branding,
          is_popular: planToSave.is_popular,
          is_active: planToSave.is_active,
        });

        setPlans((prev) => prev.map((p) => (p.id === planToSave.id ? planToSave : p)));
        success(`${planToSave.name} plan updated in database!`);
        setEditingPlan(null);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to update plan');
      }
    });
  };

  const handleCloseEditModal = () => {
    if (!editingPlan) return;
    const original = plans.find((p) => p.id === editingPlan.id);
    const hasChanges =
      original &&
      (original.name !== editingPlan.name ||
        original.price !== editingPlan.price ||
        original.price_yearly !== editingPlan.price_yearly ||
        original.strike_price !== editingPlan.strike_price ||
        original.description !== editingPlan.description ||
        original.videos !== editingPlan.videos ||
        original.photos !== editingPlan.photos ||
        original.services !== editingPlan.services ||
        original.analytics !== editingPlan.analytics ||
        original.custom_domain !== editingPlan.custom_domain ||
        original.verified_badge !== editingPlan.verified_badge ||
        original.branding !== editingPlan.branding ||
        original.is_popular !== editingPlan.is_popular ||
        original.is_active !== editingPlan.is_active ||
        original.period_text !== editingPlan.period_text);

    if (hasChanges) {
      handleSavePlanLimits(undefined, editingPlan);
    } else {
      setEditingPlan(null);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      showError('Please enter a coupon code');
      return;
    }

    setIsSavingCoupon(true);
    try {
      const res = await createCoupon({
        code: couponForm.code.trim().toUpperCase(),
        discount_percent: Number(couponForm.discount_percent),
        max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : null,
        valid_until: couponForm.valid_until ? couponForm.valid_until : null,
      });

      if (res.coupon) {
        setCoupons((prev) => [res.coupon, ...prev.filter((c) => c.id !== res.coupon.id)]);
      }
      success(`Coupon ${couponForm.code.trim().toUpperCase()} created successfully!`);
      setIsCreatingCoupon(false);
      setCouponForm({
        code: '',
        discount_percent: 20,
        valid_until: '',
        max_uses: '',
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save coupon');
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (couponId: string, currentStatus: boolean) => {
    try {
      await toggleCouponStatus(couponId, !currentStatus);
      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, is_active: !currentStatus } : c))
      );
      success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`Delete coupon code ${code}?`)) return;
    try {
      await deleteCoupon(couponId);
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      success(`Coupon ${code} deleted.`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  const handleSaveRazorpayKeys = () => {
    startTransition(async () => {
      try {
        await savePlatformSettings({
          razorpay_key_id: razorpayKeyId,
          razorpay_key_secret: razorpayKeySecret,
          razorpay_webhook_secret: webhookSecret,
        });
        success('Razorpay API keys saved securely to database!');
      } catch (err) {
        showError('Failed to save payment keys');
      }
    });
  };

  return (
    <div>
      {/* Header with Add Plan Button */}
      <div
        className={styles.pageHeader}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 className={styles.pageTitle}>Plans & Pricing</h1>
          <p className={styles.pageSubtitle}>
            Configure subscription tiers, limits, coupons, and Razorpay integration
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreatingPlan(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Add New Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className={styles.plansGrid}>
        {plans.map((plan) => (
          <div key={plan.id} className={styles.planCard}>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className={styles.planCardName}>{plan.name}</span>
                    {plan.name === 'Premium' && <Crown size={16} color="var(--color-warning)" />}
                    {plan.is_popular && (
                      <span
                        className="badge badge-warning"
                        style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 700 }}
                      >
                        Popular
                      </span>
                    )}
                    {plan.is_active === false && (
                      <span
                        className="badge badge-error"
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                      >
                        Hidden
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text-tertiary)',
                        marginTop: '2px',
                      }}
                    >
                      {plan.description}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {plan.slug !== 'free' && (
                    <button
                      type="button"
                      className={`btn btn-ghost btn-xs ${plan.is_active === false ? 'text-secondary' : 'text-success'}`}
                      title={plan.is_active === false ? `Activate ${plan.name} Plan (Show publicly)` : `Turn OFF ${plan.name} Plan (Hide from public)`}
                      onClick={() => handleTogglePlanActive(plan)}
                      style={{
                        padding: '4px 8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: plan.is_active === false ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.1)',
                        border: plan.is_active === false ? '1px solid var(--color-border)' : '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {plan.is_active === false ? (
                        <>
                          <EyeOff size={13} /> OFF
                        </>
                      ) : (
                        <>
                          <Eye size={13} /> Active
                        </>
                      )}
                    </button>
                  )}
                  {plan.slug !== 'free' && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      title={`Delete ${plan.name} Plan`}
                      onClick={() => setPlanToDelete(plan)}
                      style={{ padding: '6px', opacity: 0.7 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ margin: 'var(--space-3) 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                  {plan.strike_price && plan.strike_price > plan.price && (
                    <span
                      style={{
                        textDecoration: 'line-through',
                        color: 'var(--text-tertiary)',
                        fontSize: '1rem',
                        fontWeight: 500,
                      }}
                    >
                      ₹{plan.strike_price}
                    </span>
                  )}
                  <span className={styles.planCardPrice}>
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </span>
                </div>
                {plan.price > 0 ? (
                  <div className={styles.planCardSub}>
                    {plan.period_text || '/month'} {plan.price_yearly ? `(₹${plan.price_yearly}/yr)` : ''}
                  </div>
                ) : (
                  <div className={styles.planCardSub}>
                    {plan.period_text || 'forever'}
                  </div>
                )}
              </div>
            </div>

            <ul className={styles.planCardFeatures}>
              <li>{plan.videos === -1 ? 'Unlimited videos' : `${plan.videos} videos`}</li>
              <li>{plan.photos === -1 ? 'Unlimited photos' : `${plan.photos} photos`}</li>
              <li>
                {plan.services === -1
                  ? 'Unlimited services'
                  : `${plan.services} service packages`}
              </li>
              <li>{plan.analytics ? 'Analytics dashboard' : 'No analytics'}</li>
              <li>{plan.custom_domain ? 'Custom domain' : 'Subdomain only'}</li>
              <li>
                {plan.verified_badge
                  ? 'Verified Artist Badge (Blue tick)'
                  : 'No verified badge'}
              </li>
              <li>All themes included</li>
              <li>
                {plan.branding ? 'Shows StageHost branding' : 'No branding (White-label)'}
              </li>
            </ul>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1 }}
                onClick={() => setEditingPlan({ ...plan })}
              >
                <Edit2 size={14} /> Edit Limits
              </button>
              {plan.slug !== 'free' && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-error"
                  title={`Delete ${plan.name} Plan`}
                  onClick={() => setPlanToDelete(plan)}
                  style={{ padding: '0 10px' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Razorpay Integration */}
      <div style={{ marginTop: 'var(--space-8)' }}>
        <h3 className={styles.sectionTitle}>Razorpay Integration Settings</h3>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className={styles.settingRow}>
              <div>
                <div className={styles.settingLabel}>Razorpay Key ID</div>
                <div className={styles.settingDesc}>Key ID from Razorpay Dashboard API Keys</div>
              </div>
              <input
                className={styles.settingInput}
                type="password"
                placeholder="rzp_test_..."
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
              />
            </div>
            <div className={styles.settingRow}>
              <div>
                <div className={styles.settingLabel}>Razorpay Key Secret</div>
                <div className={styles.settingDesc}>Secret key for order signatures</div>
              </div>
              <input
                className={styles.settingInput}
                type="password"
                placeholder="••••••••••••"
                value={razorpayKeySecret}
                onChange={(e) => setRazorpayKeySecret(e.target.value)}
              />
            </div>
            <div className={styles.settingRow}>
              <div>
                <div className={styles.settingLabel}>Webhook Secret</div>
                <div className={styles.settingDesc}>
                  Secret to verify HMAC signature from Razorpay webhooks
                </div>
              </div>
              <input
                className={styles.settingInput}
                type="password"
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
            </div>
            <div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveRazorpayKeys}
                disabled={isPending}
              >
                {isPending ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save Keys
              </button>
            </div>
          </div>
        </div>

        {/* Promotional Coupons & Promo Codes */}
        <div className={styles.tableCard} style={{ marginTop: 'var(--space-6)' }}>
          <div
            style={{
              padding: 'var(--space-4) var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={20} color="var(--color-primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Promotional Coupons & Promo Codes</h3>
                <p className="text-secondary text-xs" style={{ margin: 0 }}>
                  Give anchors discounts on subscription plans (e.g. 20% OFF or Flat ₹500 discount)
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsCreatingCoupon(true)}
            >
              <Plus size={14} /> Create Promo Code
            </button>
          </div>

          {coupons.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'var(--color-text-tertiary)',
              }}
            >
              <Tag size={32} style={{ margin: '0 auto var(--space-2)', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No promo codes created yet.</p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 'var(--space-2)', color: 'var(--color-primary)' }}
                onClick={() => setIsCreatingCoupon(true)}
              >
                + Create your first discount coupon
              </button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Discount</th>
                  <th>Applies To</th>
                  <th>Redemptions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span
                        className="badge badge-accent"
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {c.code}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                        {c.discount_percent}% OFF
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-secondary">
                        All Plans
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {c.times_used ?? 0}
                        {c.max_uses ? ` / ${c.max_uses}` : ' (Unlimited)'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${c.is_active ? 'badge-success' : 'badge-error'}`}
                        style={{ fontSize: '11px' }}
                      >
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          title={c.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleCoupon(c.id, c.is_active)}
                        >
                          {c.is_active ? 'Pause' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          title="Delete Coupon"
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Coupon Modal */}
      {isCreatingCoupon && (
        <div className="modal-backdrop" onClick={() => setIsCreatingCoupon(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={18} color="var(--color-primary)" />
                <h3 style={{ margin: 0 }}>Create Promo Code</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setIsCreatingCoupon(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon}>
              <div
                className="modal-body"
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div className="input-group">
                  <label className="input-label">Coupon Code (e.g. FESTIVE30, STAGE20)</label>
                  <input
                    type="text"
                    required
                    placeholder="SUMMER25"
                    className="input"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                    }
                    style={{
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                    }}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    className="input"
                    value={couponForm.discount_percent}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, discount_percent: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">
                    Max Allowed Uses (Optional, leave blank for unlimited)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    className="input"
                    value={couponForm.max_uses}
                    onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">
                    Expiry Date (Optional, leave blank for no expiry)
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={couponForm.valid_until}
                    onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsCreatingCoupon(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSavingCoupon}>
                  {isSavingCoupon ? <Loader2 size={14} className="spin" /> : <Save size={14} />}{' '}
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Plan Modal */}
      {isCreatingPlan && (
        <div className="modal-backdrop" onClick={() => setIsCreatingPlan(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Sticky Header */}
            <div
              className="modal-header"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                background: 'var(--color-bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '17px' }}>Add New Subscription Plan</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setIsCreatingPlan(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form
              onSubmit={handleCreatePlan}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div
                className="modal-body"
                style={{
                  padding: '20px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  flex: 1,
                }}
              >
                <div className="input-group">
                  <label className="input-label">Plan Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agency, Pro Plus, VIP Anchor"
                    className="input"
                    value={newPlanForm.name}
                    onChange={(e) => handlePlanNameChange(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Slug (Identifier)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. agency"
                    className="input"
                    value={newPlanForm.slug}
                    onChange={(e) =>
                      setNewPlanForm({
                        ...newPlanForm,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })
                    }
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Short Description / Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. For talent agencies and elite celebrity anchors"
                    className="input"
                    value={newPlanForm.description}
                    onChange={(e) =>
                      setNewPlanForm({ ...newPlanForm, description: e.target.value })
                    }
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div className="input-group">
                    <label className="input-label">Monthly Price (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="input"
                      value={newPlanForm.price_monthly}
                      onChange={(e) =>
                        setNewPlanForm({
                          ...newPlanForm,
                          price_monthly: Number(e.target.value),
                          price_yearly: Number(e.target.value) * 10,
                        })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Yearly Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="input"
                      value={newPlanForm.price_yearly}
                      onChange={(e) =>
                        setNewPlanForm({ ...newPlanForm, price_yearly: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Strike Price (₹)
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      placeholder="e.g. 999"
                      value={newPlanForm.strike_price}
                      onChange={(e) =>
                        setNewPlanForm({ ...newPlanForm, strike_price: e.target.value })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Billing Period / Subtext
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>(e.g. &quot;/month&quot; or &quot;forever&quot;)</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="/month"
                      value={newPlanForm.period_text}
                      onChange={(e) =>
                        setNewPlanForm({ ...newPlanForm, period_text: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                  }}
                >
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '11px' }}>
                      Videos (-1 unlim.)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={newPlanForm.videos}
                      onChange={(e) =>
                        setNewPlanForm({ ...newPlanForm, videos: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '11px' }}>
                      Photos (-1 unlim.)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={newPlanForm.photos}
                      onChange={(e) =>
                        setNewPlanForm({ ...newPlanForm, photos: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '11px' }}>
                      Packages (-1 unlim.)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={newPlanForm.services}
                      onChange={(e) =>
                        setNewPlanForm({ ...newPlanForm, services: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Verified Artist Badge</div>
                      <div className="text-xs text-secondary">
                        Blue tick badge on profile & directory
                      </div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={newPlanForm.verified_badge}
                        onChange={(e) =>
                          setNewPlanForm({ ...newPlanForm, verified_badge: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Analytics Dashboard</div>
                      <div className="text-xs text-secondary">Show visitor and leads metrics</div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={newPlanForm.analytics}
                        onChange={(e) =>
                          setNewPlanForm({ ...newPlanForm, analytics: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Custom Domain Connection</div>
                      <div className="text-xs text-secondary">Connect yourname.com</div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={newPlanForm.custom_domain}
                        onChange={(e) =>
                          setNewPlanForm({ ...newPlanForm, custom_domain: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Show StageHost Watermark</div>
                      <div className="text-xs text-secondary">
                        Turn off for 100% white-label experience
                      </div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={newPlanForm.branding}
                        onChange={(e) =>
                          setNewPlanForm({ ...newPlanForm, branding: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Mark as &quot;Most Popular&quot;</div>
                      <div className="text-xs text-secondary">
                        Highlights plan with accent border on pricing page
                      </div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={newPlanForm.is_popular}
                        onChange={(e) =>
                          setNewPlanForm({ ...newPlanForm, is_popular: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div
                className="modal-footer"
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--color-border)',
                  background: 'var(--color-bg-card)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsCreatingPlan(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSavingPlan}
                  style={{ minWidth: '140px' }}
                >
                  {isSavingPlan ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}{' '}
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="modal-backdrop" onClick={handleCloseEditModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Sticky Header */}
            <div
              className="modal-header"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                background: 'var(--color-bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '17px' }}>Edit {editingPlan.name} Plan</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-xs"
                  onClick={() => handleSavePlanLimits()}
                  disabled={isPending}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                >
                  {isPending ? <Loader2 size={12} className="spin" /> : <Save size={12} />} Save
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={handleCloseEditModal}
                  title="Close (saves changes)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSavePlanLimits}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div
                className="modal-body"
                style={{
                  padding: '20px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  flex: 1,
                }}
              >
                <div className="input-group">
                  <label className="input-label">Plan Name</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Description / Tagline</label>
                  <input
                    type="text"
                    className="input"
                    value={editingPlan.description || ''}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, description: e.target.value })
                    }
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div className="input-group">
                    <label className="input-label">Monthly Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={editingPlan.price}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, price: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Yearly Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={editingPlan.price_yearly ?? editingPlan.price * 10}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, price_yearly: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Strike Price (₹)
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>(Optional ~₹999~)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      placeholder="e.g. 999"
                      value={editingPlan.strike_price ?? ''}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          strike_price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Billing Period / Subtext
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>(e.g. &quot;forever&quot; or &quot;/month&quot;)</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder={editingPlan.price === 0 ? 'forever' : '/month'}
                      value={editingPlan.period_text ?? ''}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          period_text: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                  }}
                >
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '11px' }}>
                      Videos (-1 unlim.)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={editingPlan.videos}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, videos: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '11px' }}>
                      Photos (-1 unlim.)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={editingPlan.photos}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, photos: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '11px' }}>
                      Packages (-1 unlim.)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={editingPlan.services}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, services: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Verified Artist Badge</div>
                      <div className="text-xs text-secondary">
                        Blue tick badge on profile & directory
                      </div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={editingPlan.verified_badge ?? false}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, verified_badge: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Analytics Dashboard</div>
                      <div className="text-xs text-secondary">Show visitor and leads metrics</div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={editingPlan.analytics}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, analytics: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Custom Domain Connection</div>
                      <div className="text-xs text-secondary">Connect yourname.com</div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={editingPlan.custom_domain}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, custom_domain: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Show StageHost Watermark</div>
                      <div className="text-xs text-secondary">
                        Turn off for 100% white-label experience
                      </div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={editingPlan.branding}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, branding: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  {editingPlan.slug !== 'free' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div className="text-sm font-semibold">Plan Visibility (Active)</div>
                        <div className="text-xs text-secondary">
                          Turn OFF to temporarily hide this plan from Home & Pricing pages
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={editingPlan.is_active !== false}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, is_active: e.target.checked })
                          }
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold">Mark as &quot;Most Popular&quot;</div>
                      <div className="text-xs text-secondary">
                        Highlights plan with accent border on pricing page
                      </div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={editingPlan.is_popular ?? false}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, is_popular: e.target.checked })
                        }
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div
                className="modal-footer"
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--color-border)',
                  background: 'var(--color-bg-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {editingPlan.slug !== 'free' ? (
                  <button
                    type="button"
                    className="btn btn-ghost text-error btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setPlanToDelete(editingPlan);
                    }}
                  >
                    <Trash2 size={14} /> Delete Plan
                  </button>
                ) : (
                  <span className="text-xs text-secondary">Base Free tier cannot be deleted</span>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditingPlan(null)}
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isPending}
                    style={{ minWidth: '140px' }}
                  >
                    {isPending ? <Loader2 size={14} className="spin" /> : <Save size={14} />}{' '}
                    Save to Database
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {planToDelete && (
        <div className="modal-backdrop" onClick={() => setPlanToDelete(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="var(--color-error)" />
                <h3 style={{ margin: 0 }}>Delete {planToDelete.name} Plan?</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setPlanToDelete(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to delete the <strong>{planToDelete.name}</strong> plan (₹{planToDelete.price}/month)?
              </p>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                <strong>Smart Protection:</strong> If any users are currently subscribed to this plan, it will be automatically <strong>deactivated & hidden</strong> from public pricing instead of being hard deleted, so active subscriber accounts remain intact.
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPlanToDelete(null)}
                disabled={isDeletingPlan}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                onClick={handleConfirmDeletePlan}
                disabled={isDeletingPlan}
              >
                {isDeletingPlan ? (
                  <>
                    <Loader2 size={14} className="spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
