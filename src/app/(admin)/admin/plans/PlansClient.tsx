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
  Check,
  RefreshCw,
  FileText,
  Sliders,
  Calendar,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
  Globe,
  Smartphone,
  Lock,
  Star,
  HardDrive,
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
  storage_gb?: number;
  analytics: boolean;
  custom_domain: boolean;
  verified_badge?: boolean;
  themes: number;
  branding: boolean;
  phone_verification?: boolean;
  digital_agreements?: boolean;
  tech_rider?: boolean;
  client_reviews?: boolean;
  featured_directory?: boolean;
  calendar_sync?: boolean;
  pdf_quotations?: boolean;
  offline_pwa?: boolean;
  features?: string[];
}

interface PlansClientProps {
  initialPlans: PlanConfig[];
  initialCoupons?: Coupon[];
}

function generateDefaultBullets(plan: {
  videos?: number;
  photos?: number;
  services?: number;
  storage_gb?: number;
  themes?: number;
  analytics?: boolean;
  custom_domain?: boolean;
  verified_badge?: boolean;
  branding?: boolean;
  phone_verification?: boolean;
  digital_agreements?: boolean;
  tech_rider?: boolean;
  client_reviews?: boolean;
  featured_directory?: boolean;
  calendar_sync?: boolean;
  pdf_quotations?: boolean;
  offline_pwa?: boolean;
}): string[] {
  const bullets: string[] = [
    plan.videos === -1 ? 'Unlimited showreel videos' : `${plan.videos ?? 5} showreel videos`,
    plan.photos === -1 ? 'Unlimited photo gallery' : `${plan.photos ?? 10} photos`,
    plan.services === -1 ? 'Unlimited service packages' : `${plan.services ?? 3} service packages`,
    plan.storage_gb !== undefined && plan.storage_gb > 0
      ? `${plan.storage_gb} GB Cloud Media Vault (Audio/Video)`
      : 'External Video & Audio links (YouTube/Drive)',
    'Direct WhatsApp booking button',
    'BookMyArtist Directory listing',
    'Zero booking commissions',
  ];

  if (plan.verified_badge) bullets.push('Verified Artist Blue Tick Badge');
  if (plan.phone_verification) bullets.push('1-Click Phone Verified Leads');
  if (plan.digital_agreements) bullets.push('Digital E-Sign Event Agreements');
  if (plan.tech_rider) bullets.push('Tech Rider Studio & Sound Specs');
  if (plan.client_reviews) bullets.push('Verified Client Review Collector');
  if (plan.featured_directory) bullets.push('Featured Directory Top Boost');
  if (plan.calendar_sync) bullets.push('Google / Apple Calendar Auto-Sync');
  if (plan.pdf_quotations) bullets.push('Instant PDF Quotation & Invoice Generator');
  if (plan.analytics) bullets.push('Advanced visitor & lead analytics');
  if (plan.custom_domain) bullets.push('Custom domain connection (yourname.com)');
  if (!plan.branding) bullets.push('100% White-Label (No BookMyArtist branding)');
  if (plan.offline_pwa) bullets.push('Offline PWA & Event Day Mode');
  if ((plan.themes ?? 1) > 1) {
    bullets.push(`${plan.themes === -1 ? 'All' : plan.themes} themes unlocked`);
  }

  return bullets;
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
  storage_gb: 5,
  analytics: true,
  custom_domain: false,
  verified_badge: true,
  branding: false,
  is_popular: false,
  phone_verification: true,
  digital_agreements: true,
  tech_rider: true,
  client_reviews: true,
  featured_directory: false,
  calendar_sync: true,
  pdf_quotations: true,
  offline_pwa: true,
  customBullets: [] as string[],
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
  const [newCreateBulletText, setNewCreateBulletText] = useState('');
  const [newEditBulletText, setNewEditBulletText] = useState('');

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

  // Custom bullet points handlers for Edit Modal
  const handleAddEditBullet = () => {
    if (!newEditBulletText.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...(editingPlan.features || []), newEditBulletText.trim()],
    });
    setNewEditBulletText('');
  };

  const handleUpdateEditBullet = (index: number, val: string) => {
    if (!editingPlan) return;
    const updated = [...(editingPlan.features || [])];
    updated[index] = val;
    setEditingPlan({ ...editingPlan, features: updated });
  };

  const handleDeleteEditBullet = (index: number) => {
    if (!editingPlan) return;
    const updated = (editingPlan.features || []).filter((_, idx) => idx !== index);
    setEditingPlan({ ...editingPlan, features: updated });
  };

  const handleAutoGenerateEditBullets = () => {
    if (!editingPlan) return;
    const bullets = generateDefaultBullets(editingPlan);
    setEditingPlan({ ...editingPlan, features: bullets });
  };

  // Custom bullet points handlers for Create Modal
  const handleAddCreateBullet = () => {
    if (!newCreateBulletText.trim()) return;
    setNewPlanForm((prev) => ({
      ...prev,
      customBullets: [...prev.customBullets, newCreateBulletText.trim()],
    }));
    setNewCreateBulletText('');
  };

  const handleUpdateCreateBullet = (index: number, val: string) => {
    setNewPlanForm((prev) => {
      const updated = [...prev.customBullets];
      updated[index] = val;
      return { ...prev, customBullets: updated };
    });
  };

  const handleDeleteCreateBullet = (index: number) => {
    setNewPlanForm((prev) => ({
      ...prev,
      customBullets: prev.customBullets.filter((_, idx) => idx !== index),
    }));
  };

  const handleAutoGenerateCreateBullets = () => {
    const bullets = generateDefaultBullets(newPlanForm);
    setNewPlanForm((prev) => ({ ...prev, customBullets: bullets }));
  };

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
        storage_gb: Number(newPlanForm.storage_gb),
        analytics: newPlanForm.analytics,
        custom_domain: newPlanForm.custom_domain,
        verified_badge: newPlanForm.verified_badge,
        branding: newPlanForm.branding,
        is_popular: newPlanForm.is_popular,
        phone_verification: newPlanForm.phone_verification,
        digital_agreements: newPlanForm.digital_agreements,
        tech_rider: newPlanForm.tech_rider,
        client_reviews: newPlanForm.client_reviews,
        featured_directory: newPlanForm.featured_directory,
        calendar_sync: newPlanForm.calendar_sync,
        pdf_quotations: newPlanForm.pdf_quotations,
        offline_pwa: newPlanForm.offline_pwa,
        features: newPlanForm.customBullets.length > 0 ? newPlanForm.customBullets : undefined,
      });

      if (res.plan) {
        setPlans((prev) => [...prev, res.plan as any]);
      }
      success(`Plan "${newPlanForm.name}" created and published!`);
      setIsCreatingPlan(false);
      setNewPlanForm(defaultNewPlanState);
      setNewCreateBulletText('');
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
        phone_verification: plan.phone_verification,
        digital_agreements: plan.digital_agreements,
        tech_rider: plan.tech_rider,
        client_reviews: plan.client_reviews,
        featured_directory: plan.featured_directory,
        calendar_sync: plan.calendar_sync,
        pdf_quotations: plan.pdf_quotations,
        offline_pwa: plan.offline_pwa,
        features: plan.features,
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
          storage_gb: planToSave.storage_gb,
          themes: planToSave.themes,
          analytics: planToSave.analytics,
          custom_domain: planToSave.custom_domain,
          verified_badge: planToSave.verified_badge,
          branding: planToSave.branding,
          is_popular: planToSave.is_popular,
          is_active: planToSave.is_active,
          phone_verification: planToSave.phone_verification,
          digital_agreements: planToSave.digital_agreements,
          tech_rider: planToSave.tech_rider,
          client_reviews: planToSave.client_reviews,
          featured_directory: planToSave.featured_directory,
          calendar_sync: planToSave.calendar_sync,
          pdf_quotations: planToSave.pdf_quotations,
          offline_pwa: planToSave.offline_pwa,
          features: planToSave.features,
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
        original.storage_gb !== editingPlan.storage_gb ||
        original.analytics !== editingPlan.analytics ||
        original.custom_domain !== editingPlan.custom_domain ||
        original.verified_badge !== editingPlan.verified_badge ||
        original.branding !== editingPlan.branding ||
        original.is_popular !== editingPlan.is_popular ||
        original.is_active !== editingPlan.is_active ||
        original.period_text !== editingPlan.period_text ||
        original.phone_verification !== editingPlan.phone_verification ||
        original.digital_agreements !== editingPlan.digital_agreements ||
        original.tech_rider !== editingPlan.tech_rider ||
        original.client_reviews !== editingPlan.client_reviews ||
        original.featured_directory !== editingPlan.featured_directory ||
        original.calendar_sync !== editingPlan.calendar_sync ||
        original.pdf_quotations !== editingPlan.pdf_quotations ||
        original.offline_pwa !== editingPlan.offline_pwa ||
        JSON.stringify(original.features) !== JSON.stringify(editingPlan.features));

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

            {/* Platform Feature Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '8px 0 12px' }}>
              {(plan.storage_gb !== undefined && plan.storage_gb > 0) ? (
                <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <HardDrive size={10} /> {plan.storage_gb} GB Vault
                </span>
              ) : (
                <span className="badge badge-ghost" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-tertiary)' }}>
                  <Lock size={10} /> 0 GB (Links Only)
                </span>
              )}
              {plan.phone_verification && (
                <span className="badge badge-primary" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <ShieldCheck size={10} /> Verified OTP
                </span>
              )}
              {plan.digital_agreements && (
                <span className="badge badge-accent" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <FileText size={10} /> E-Sign
                </span>
              )}
              {plan.tech_rider && (
                <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Sliders size={10} /> Tech Rider
                </span>
              )}
              {plan.client_reviews && (
                <span className="badge badge-secondary" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={10} /> Reviews
                </span>
              )}
              {plan.calendar_sync && (
                <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Calendar size={10} /> Calendar
                </span>
              )}
              {plan.pdf_quotations && (
                <span className="badge badge-warning" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <FileSpreadsheet size={10} /> PDF Quotes
                </span>
              )}
              {plan.featured_directory && (
                <span className="badge badge-warning" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Zap size={10} /> Top Boost
                </span>
              )}
              {plan.offline_pwa && (
                <span className="badge badge-ghost" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Smartphone size={10} /> PWA
                </span>
              )}
            </div>

            {/* Live Pricing Bullets Preview */}
            <div style={{ margin: '8px 0', borderTop: '1px dashed var(--color-border)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} color="var(--color-primary)" /> Pricing Bullets
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 600 }}>
                  {plan.features?.length ?? 0} bullets live
                </span>
              </div>
              <ul className={styles.planCardFeatures} style={{ maxHeight: '160px', overflowY: 'auto' }}>
                {(plan.features && plan.features.length > 0
                  ? plan.features
                  : [
                      plan.videos === -1 ? 'Unlimited showreels' : `${plan.videos} videos`,
                      plan.photos === -1 ? 'Unlimited photos' : `${plan.photos} photos`,
                      plan.services === -1 ? 'Unlimited services' : `${plan.services} service packages`,
                      plan.analytics ? 'Analytics dashboard' : 'No analytics',
                      plan.custom_domain ? 'Custom domain' : 'Subdomain only',
                      plan.verified_badge ? 'Verified Artist Badge' : 'No verified badge',
                      plan.branding ? 'BookMyArtist branding' : 'Zero branding (White-label)',
                    ]
                ).map((feat, fIdx) => (
                  <li key={fIdx} style={{ fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <Check size={12} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => setEditingPlan({ ...plan, features: plan.features ? [...plan.features] : generateDefaultBullets(plan) })}
              >
                <Edit2 size={14} /> Edit Plan & Bullets
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
              maxWidth: '680px',
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
                    gridTemplateColumns: 'repeat(4, 1fr)',
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
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '11px' }} title="0 GB locks direct cloud file uploads for this plan">
                      Storage (GB, 0=Lock)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={newPlanForm.storage_gb ?? 0}
                      onChange={(e) =>
                        setNewPlanForm({ ...newPlanForm, storage_gb: Number(e.target.value) })
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
                      <div className="text-sm font-semibold">Show BookMyArtist Watermark</div>
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

                {/* Platform Feature Entitlements Section */}
                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders size={16} color="var(--color-primary)" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                        Platform Feature Entitlements
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      Assign platform modules to this plan tier
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                      gap: '10px',
                    }}
                  >
                    {/* Phone Verification */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={16} color="var(--color-primary)" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Phone OTP Verified Leads</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Filter spam inquiries</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={newPlanForm.phone_verification}
                          onChange={(e) => setNewPlanForm({ ...newPlanForm, phone_verification: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Digital Agreements */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#06b6d4" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Digital E-Sign Agreements</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Performance contracts</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={newPlanForm.digital_agreements}
                          onChange={(e) => setNewPlanForm({ ...newPlanForm, digital_agreements: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Tech Rider */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sliders size={16} color="#8b5cf6" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Tech Rider Studio</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Sound & mic specs generator</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={newPlanForm.tech_rider}
                          onChange={(e) => setNewPlanForm({ ...newPlanForm, tech_rider: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Client Reviews */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={16} color="#f59e0b" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Verified Client Reviews</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Testimonial collection</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={newPlanForm.client_reviews}
                          onChange={(e) => setNewPlanForm({ ...newPlanForm, client_reviews: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Calendar Sync */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#10b981" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Calendar Auto-Sync</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Google / Apple calendar</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={newPlanForm.calendar_sync}
                          onChange={(e) => setNewPlanForm({ ...newPlanForm, calendar_sync: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* PDF Quotations */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSpreadsheet size={16} color="#ec4899" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>PDF Quotations & Invoices</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>GST-ready estimate builder</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={newPlanForm.pdf_quotations}
                          onChange={(e) => setNewPlanForm({ ...newPlanForm, pdf_quotations: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Featured Directory Boost */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} color="#f97316" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Featured Directory Boost</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Top ranking in search</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={newPlanForm.featured_directory}
                          onChange={(e) => setNewPlanForm({ ...newPlanForm, featured_directory: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Offline PWA */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Smartphone size={16} color="#6366f1" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Offline PWA Mode</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>No-internet event day tools</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={newPlanForm.offline_pwa}
                          onChange={(e) => setNewPlanForm({ ...newPlanForm, offline_pwa: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Custom Bullets Manager Section */}
                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={16} color="var(--color-warning)" />
                        <span className="text-sm font-semibold">Pricing Card Bullet Points</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        These exact bullets sync to the public pricing cards on / and /pricing
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={handleAutoGenerateCreateBullets}
                      style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                    >
                      <RefreshCw size={11} /> Auto-Generate from Toggles
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {newPlanForm.customBullets.map((bText, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-tertiary)', width: '18px', textAlign: 'center' }}>
                          {bIdx + 1}.
                        </span>
                        <input
                          type="text"
                          className="input input-sm"
                          value={bText}
                          onChange={(e) => handleUpdateCreateBullet(bIdx, e.target.value)}
                          style={{ flex: 1, fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDeleteCreateBullet(bIdx)}
                          style={{ padding: '4px 6px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="Add custom bullet (e.g. VIP Concierge Support)..."
                        value={newCreateBulletText}
                        onChange={(e) => setNewCreateBulletText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCreateBullet();
                          }
                        }}
                        style={{ flex: 1, fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleAddCreateBullet}
                        style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
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
              maxWidth: '680px',
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
                    gridTemplateColumns: 'repeat(4, 1fr)',
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
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '11px' }} title="0 GB locks direct cloud file uploads for this plan">
                      Storage (GB, 0=Lock)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={editingPlan.storage_gb ?? 0}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, storage_gb: Number(e.target.value) })
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
                      <div className="text-sm font-semibold">Show BookMyArtist Watermark</div>
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

                {/* Platform Feature Entitlements Section */}
                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders size={16} color="var(--color-primary)" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                        Platform Feature Entitlements
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      Assign platform modules to this plan tier
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                      gap: '10px',
                    }}
                  >
                    {/* Phone Verification */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={16} color="var(--color-primary)" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Phone OTP Verified Leads</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Filter spam inquiries</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={editingPlan.phone_verification ?? true}
                          onChange={(e) => setEditingPlan({ ...editingPlan, phone_verification: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Digital Agreements */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#06b6d4" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Digital E-Sign Agreements</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Performance contracts</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={editingPlan.digital_agreements ?? false}
                          onChange={(e) => setEditingPlan({ ...editingPlan, digital_agreements: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Tech Rider */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sliders size={16} color="#8b5cf6" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Tech Rider Studio</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Sound & mic specs generator</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={editingPlan.tech_rider ?? false}
                          onChange={(e) => setEditingPlan({ ...editingPlan, tech_rider: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Client Reviews */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={16} color="#f59e0b" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Verified Client Reviews</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Testimonial collection</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={editingPlan.client_reviews ?? true}
                          onChange={(e) => setEditingPlan({ ...editingPlan, client_reviews: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Calendar Sync */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#10b981" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Calendar Auto-Sync</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Google / Apple calendar</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={editingPlan.calendar_sync ?? false}
                          onChange={(e) => setEditingPlan({ ...editingPlan, calendar_sync: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* PDF Quotations */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSpreadsheet size={16} color="#ec4899" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>PDF Quotations & Invoices</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>GST-ready estimate builder</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={editingPlan.pdf_quotations ?? false}
                          onChange={(e) => setEditingPlan({ ...editingPlan, pdf_quotations: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Featured Directory Boost */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} color="#f97316" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Featured Directory Boost</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Top ranking in search</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={editingPlan.featured_directory ?? false}
                          onChange={(e) => setEditingPlan({ ...editingPlan, featured_directory: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {/* Offline PWA */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Smartphone size={16} color="#6366f1" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>Offline PWA Mode</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>No-internet event day tools</div>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={editingPlan.offline_pwa ?? true}
                          onChange={(e) => setEditingPlan({ ...editingPlan, offline_pwa: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Custom Bullets Manager Section */}
                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={16} color="var(--color-warning)" />
                        <span className="text-sm font-semibold">Pricing Card Bullet Points</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        These exact bullets sync to the public pricing cards on / and /pricing
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={handleAutoGenerateEditBullets}
                      style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                    >
                      <RefreshCw size={11} /> Auto-Generate from Toggles
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(editingPlan.features || []).map((bText, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-tertiary)', width: '18px', textAlign: 'center' }}>
                          {bIdx + 1}.
                        </span>
                        <input
                          type="text"
                          className="input input-sm"
                          value={bText}
                          onChange={(e) => handleUpdateEditBullet(bIdx, e.target.value)}
                          style={{ flex: 1, fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDeleteEditBullet(bIdx)}
                          style={{ padding: '4px 6px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="Add custom bullet (e.g. VIP Concierge Support)..."
                        value={newEditBulletText}
                        onChange={(e) => setNewEditBulletText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEditBullet();
                          }
                        }}
                        style={{ flex: 1, fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleAddEditBullet}
                        style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
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
