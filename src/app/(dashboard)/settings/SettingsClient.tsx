'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  User, Bell, CreditCard, Shield, Link,
  Eye, Copy, Check, ExternalLink, Crown, Sparkles, Loader2, Edit3, Save, X,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { CheckoutButton } from '@/components/payment/CheckoutButton';
import { updateProfile, updateSlug } from '@/lib/actions/profile';
import type { AnchorProfile, Subscription } from '@/types';
import styles from './settings.module.css';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
] as const;

type TabId = typeof TABS[number]['id'];

import { toggleCalendarVisibility } from '@/lib/actions/schedule';
import type { PublicPlan } from '@/lib/actions/plans';

interface SettingsClientProps {
  initialProfile: AnchorProfile | null;
  initialSubscription: Partial<Subscription> | null;
  initialShowCalendar?: boolean;
  plans?: PublicPlan[];
}

export function SettingsClient({
  initialProfile,
  initialSubscription,
  initialShowCalendar = true,
  plans = [],
}: SettingsClientProps) {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [showCalendar, setShowCalendar] = useState(initialShowCalendar);

  const [profile, setProfile] = useState<AnchorProfile | null>(initialProfile);

  // Slug editing state
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState(initialProfile?.slug || '');

  // Privacy toggles
  const [isListed, setIsListed] = useState(initialProfile?.is_listed_in_directory ?? true);

  // Determine current origin for URL
  const [origin, setOrigin] = useState('http://localhost:3000');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const currentSlug = profile?.slug || 'my-portfolio';
  const portfolioUrl = `${origin}/${currentSlug}`;

  const currentPlan = (initialSubscription?.plan_name || 'Free').toLowerCase();

  const copyLink = () => {
    navigator.clipboard.writeText(portfolioUrl);
    setCopied(true);
    success('Portfolio URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSlug = () => {
    startTransition(async () => {
      try {
        const updated = await updateSlug(slugInput);
        setProfile(updated);
        setIsEditingSlug(false);
        success('Custom portfolio URL updated!');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to update URL');
      }
    });
  };

  const handleToggleDirectory = (checked: boolean) => {
    setIsListed(checked);
    startTransition(async () => {
      try {
        await updateProfile({ is_listed_in_directory: checked });
        success(checked ? 'Listed in public anchor directory!' : 'Removed from public directory');
      } catch (err) {
        setIsListed(!checked);
        showError('Failed to update directory status');
      }
    });
  };

  const handleToggleCalendar = (checked: boolean) => {
    setShowCalendar(checked);
    startTransition(async () => {
      try {
        await toggleCalendarVisibility(checked);
        success(
          checked
            ? 'Live schedule is now visible on your public portfolio!'
            : 'Live schedule is now hidden from your public portfolio'
        );
      } catch (err) {
        setShowCalendar(!checked);
        showError('Failed to update calendar visibility');
      }
    });
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Settings</h1>

      {/* Portfolio Link Header Card */}
      <div className={styles.linkCard}>
        <div className={styles.linkInfo}>
          <Link size={18} />
          <div>
            <span className={styles.linkLabel}>Your Public Portfolio URL</span>
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>
              {portfolioUrl} <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={copyLink}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={cn(styles.tab, activeTab === tab.id && styles.tabActive)}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {/* PROFILE / ACCOUNT TAB */}
          {activeTab === 'profile' && (
            <div className={styles.settingsSection}>
              <h3>Account Details</h3>
              <div className={styles.settingRow}>
                <div>
                  <span className={styles.settingLabel}>Email Address</span>
                  <p className={styles.settingValue}>{profile?.email || 'Your registered email'}</p>
                </div>
                <span className="badge badge-success">Verified</span>
              </div>

              <div className={styles.settingRow}>
                <div>
                  <span className={styles.settingLabel}>Display Name</span>
                  <p className={styles.settingValue}>{profile?.name || 'Anchor'}</p>
                </div>
                <a href="/portfolio" className="btn btn-ghost btn-sm">Edit in Profile</a>
              </div>

              <div className={styles.settingRow}>
                <div>
                  <span className={styles.settingLabel}>Custom Portfolio Slug</span>
                  {isEditingSlug ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span className="text-sm text-tertiary">{origin}/</span>
                      <input
                        className="input"
                        style={{ padding: '4px 8px', width: '180px' }}
                        value={slugInput}
                        onChange={(e) => setSlugInput(e.target.value)}
                        placeholder="your-custom-slug"
                      />
                      <button className="btn btn-primary btn-xs" onClick={handleSaveSlug} disabled={isPending}>
                        {isPending ? <Loader2 size={12} className="spin" /> : <Save size={12} />} Save
                      </button>
                      <button className="btn btn-ghost btn-xs" onClick={() => { setIsEditingSlug(false); setSlugInput(profile?.slug || ''); }}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <p className={styles.settingValue}>{currentSlug}</p>
                  )}
                </div>
                {!isEditingSlug && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingSlug(true)}>
                    <Edit3 size={14} /> Edit Slug
                  </button>
                )}
              </div>

              <div className={styles.settingRow}>
                <div>
                  <span className={styles.settingLabel}>Live Tour & Availability Calendar</span>
                  <p className={styles.settingValue}>Display your booked dates and available dates publicly on your portfolio</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showCalendar}
                  className={cn('toggle', showCalendar && 'active')}
                  onClick={() => handleToggleCalendar(!showCalendar)}
                  disabled={isPending}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={showCalendar}
                    readOnly
                    tabIndex={-1}
                  />
                  <span className="toggle-slider" />
                </button>
              </div>

              <div className={styles.dangerZone}>
                <h4>Danger Zone</h4>
                <div className={styles.settingRow}>
                  <div>
                    <span className={styles.settingLabel}>Delete Account</span>
                    <p className={styles.settingValue}>Permanently delete your portfolio and all booking data</p>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }}>Delete</button>
                </div>
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className={styles.settingsSection}>
              <h3>Current Subscription</h3>
              <div className={styles.planCard}>
                <div className={styles.planInfo}>
                  <div className={styles.planBadge}>
                    <Sparkles size={16} /> {initialSubscription?.plan_name || 'Free'} Plan
                  </div>
                  <p className={styles.planDesc}>
                    {plans.find((p) => p.slug.toLowerCase() === currentPlan || p.name.toLowerCase() === currentPlan)?.description ||
                      (currentPlan === 'free'
                        ? '3 videos · 6 photos · Powered by StageHost branding'
                        : currentPlan === 'starter'
                        ? '10 videos · 20 photos · No branding · 3 themes'
                        : 'Unlimited packages · Analytics · Custom themes & domains')}
                  </p>
                </div>
              </div>

              {/* Upgrade Options */}
              <h3 style={{ marginTop: 'var(--space-8)' }}>Upgrade Your Plan</h3>
              <div className={styles.planGrid}>
                {plans
                  .filter((p) => (p.tier > 0 || p.price_monthly > 0) && p.is_active !== false)
                  .map((p) => {
                    const isCurrent =
                      currentPlan === p.slug.toLowerCase() ||
                      currentPlan === p.name.toLowerCase() ||
                      initialSubscription?.plan_id === p.id;

                    return (
                      <div
                        key={p.id}
                        className={cn(styles.upgradeCard, p.popular && styles.upgradeCardFeatured)}
                      >
                        {p.popular && <div className={styles.upgradeBestValue}>Most Popular</div>}
                        <div className={styles.upgradeCardHeader}>
                          <div className={styles.upgradeCardName}>{p.name}</div>
                          <div className={styles.upgradeCardPrice}>
                            ₹{p.price_monthly}<span>/mo</span>
                          </div>
                        </div>
                        {p.strike_price ? (
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--color-text-tertiary)',
                              textDecoration: 'line-through',
                              marginTop: '-8px',
                            }}
                          >
                            ₹{p.strike_price}
                          </div>
                        ) : null}
                        <ul className={styles.upgradeFeatures}>
                          {(p.features || []).slice(0, 6).map((feat, idx) => (
                            <li key={idx}>✓ {feat.replace(/^[✓✔•\s-]+/, '')}</li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-block"
                            disabled
                            style={{
                              opacity: 0.8,
                              cursor: 'default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <Check size={14} /> Current Plan
                          </button>
                        ) : (
                          <CheckoutButton
                            plan={p.slug}
                            planName={p.name}
                            price={p.price_monthly}
                            className={p.popular ? 'btn btn-accent btn-block' : 'btn btn-primary btn-block'}
                          >
                            <Crown size={14} /> Upgrade to {p.name}
                          </CheckoutButton>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Payment History */}
              <h3 style={{ marginTop: 'var(--space-8)' }}>Payment History</h3>
              <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                <div className="empty-state-icon"><CreditCard size={24} /></div>
                <div className="empty-state-title">No payments yet</div>
                <div className="empty-state-text">Your payment history will appear here after upgrading</div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className={styles.settingsSection}>
              <h3>Email Notifications</h3>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.settingLabel}>New Inquiry Alerts</span>
                  <p className={styles.settingValue}>Receive instant email alert via Resend when a client submits an inquiry</p>
                </div>
                <label className="toggle"><input type="checkbox" defaultChecked /><span className="toggle-slider" /></label>
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.settingLabel}>Booking Reminders</span>
                  <p className={styles.settingValue}>Get reminders 24 hours prior to booked calendar functions</p>
                </div>
                <label className="toggle"><input type="checkbox" defaultChecked /><span className="toggle-slider" /></label>
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.settingLabel}>Product Updates</span>
                  <p className={styles.settingValue}>Get notified about new themes and feature releases</p>
                </div>
                <label className="toggle"><input type="checkbox" /><span className="toggle-slider" /></label>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div className={styles.settingsSection}>
              <h3>Discovery & Contact Privacy</h3>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.settingLabel}>List in Public Anchor Directory</span>
                  <p className={styles.settingValue}>Allow event planners and clients to discover you in the directory search</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={isListed}
                    onChange={(e) => handleToggleDirectory(e.target.checked)}
                    disabled={isPending}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.settingLabel}>Show Phone Number</span>
                  <p className={styles.settingValue}>Display your phone number publicly on your portfolio</p>
                </div>
                <label className="toggle"><input type="checkbox" defaultChecked /><span className="toggle-slider" /></label>
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.settingLabel}>Show Email Address</span>
                  <p className={styles.settingValue}>Display your contact email publicly on your portfolio</p>
                </div>
                <label className="toggle"><input type="checkbox" /><span className="toggle-slider" /></label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
