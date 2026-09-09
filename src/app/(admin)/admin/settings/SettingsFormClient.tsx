'use client';

import { useState, useTransition } from 'react';
import { Check, Save, Loader2, Send, Megaphone, AlertCircle, Sparkles, Globe, ExternalLink, Palette } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { savePlatformSettings, sendAdminTestEmail, saveAnnouncementBanner, updateCustomDomainStatus } from '@/lib/actions/admin';
import { GLOBAL_SITE_THEMES } from '@/constants/site-themes';
import type { AnnouncementBanner, CustomDomainRequest } from '@/types';
import styles from '../dashboard/admin.module.css';

interface SettingsFormClientProps {
  initialSettings: Record<string, string>;
  initialBanner?: AnnouncementBanner;
  initialCustomDomains?: CustomDomainRequest[];
}

export function SettingsFormClient({ initialSettings, initialBanner, initialCustomDomains }: SettingsFormClientProps) {
  const { success, error: showError } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [customDomains, setCustomDomains] = useState<CustomDomainRequest[]>(initialCustomDomains || []);
  const [updatingDomainId, setUpdatingDomainId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [testEmailTo, setTestEmailTo] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Announcement Banner State
  const [banner, setBanner] = useState<AnnouncementBanner>(initialBanner || {
    is_active: false,
    message: '',
    link_url: '',
    link_text: '',
    type: 'info',
  });
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  const update = (key: string, val: string | boolean) =>
    setSettings((prev) => ({ ...prev, [key]: typeof val === 'boolean' ? (val ? 'true' : 'false') : val }));

  const handleSaveBanner = async () => {
    setIsSavingBanner(true);
    try {
      await saveAnnouncementBanner(banner);
      success(banner.is_active ? '📢 Broadcast banner is now LIVE for all anchors!' : 'Broadcast banner deactivated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save announcement banner');
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleSaveSettings = () => {
    startTransition(async () => {
      try {
        await savePlatformSettings(settings);
        success('All platform settings saved to database successfully!');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to save settings');
      }
    });
  };

  const handleSendTestEmail = async () => {
    const target = testEmailTo || settings.support_email || 'admin@stagehost.in';
    setIsSendingTest(true);
    try {
      await sendAdminTestEmail(target);
      success(`Test email sent successfully to ${target}!`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleDomainStatusChange = async (domainId: string, nextStatus: 'active' | 'pending' | 'rejected') => {
    setUpdatingDomainId(domainId);
    try {
      await updateCustomDomainStatus(domainId, nextStatus);
      setCustomDomains((prev) => prev.map((d) => (d.id === domainId ? { ...d, status: nextStatus } : d)));
      success(`Domain status updated to ${nextStatus.toUpperCase()}!`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update domain status');
    } finally {
      setUpdatingDomainId(null);
    }
  };

  return (

    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Platform Settings</h1>
          <p className={styles.pageSubtitle}>Global configuration for the StageHost platform</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveSettings} disabled={isPending}>
          {isPending ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save All Settings
        </button>
      </div>

      <div className={styles.settingsGrid}>
        {/* General */}
        <div className={styles.settingSection}>
          <h3>General & Branding</h3>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Platform Name</div>
              <div className={styles.settingDesc}>Shown in title tags and branding</div>
            </div>
            <input
              className={styles.settingInput}
              value={settings.platform_name || ''}
              onChange={(e) => update('platform_name', e.target.value)}
            />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Platform Tagline</div>
            </div>
            <input
              className={styles.settingInput}
              value={settings.platform_tagline || ''}
              onChange={(e) => update('platform_tagline', e.target.value)}
            />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Support Email</div>
            </div>
            <input
              className={styles.settingInput}
              value={settings.support_email || ''}
              onChange={(e) => update('support_email', e.target.value)}
            />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Support WhatsApp</div>
            </div>
            <input
              className={styles.settingInput}
              placeholder="9876543210"
              value={settings.support_whatsapp || ''}
              onChange={(e) => update('support_whatsapp', e.target.value)}
            />
          </div>
        </div>

        {/* Global Website Theme */}
        <div className={styles.settingSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={18} color="var(--color-primary)" /> Global Website Theme
            </h3>
            <a href="/admin/themes" className="btn btn-xs btn-ghost" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Theme Studio <ExternalLink size={10} />
            </a>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Master Website Theme</div>
              <div className={styles.settingDesc}>Controls site-wide color palette, buttons, cards and royal glow for all visitors</div>
            </div>
            <select
              className={styles.settingInput}
              value={settings.site_theme || 'obsidian-violet'}
              onChange={(e) => {
                const nextTheme = e.target.value;
                update('site_theme', nextTheme);
                document.documentElement.setAttribute('data-site-theme', nextTheme);
                try {
                  localStorage.setItem('stagehost_site_theme', nextTheme);
                  document.cookie = `stagehost_site_theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
                } catch {}
              }}
            >
              {GLOBAL_SITE_THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.badge} ({t.hindiName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Access Control */}
        <div className={styles.settingSection}>
          <h3>Access & Registration</h3>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Maintenance Mode</div>
              <div className={styles.settingDesc}>Temporarily show maintenance banner</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.maintenance_mode === 'true'}
                onChange={(e) => update('maintenance_mode', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Allow New Registrations</div>
              <div className={styles.settingDesc}>Toggle open/closed registration</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.allow_new_registrations !== 'false'}
                onChange={(e) => update('allow_new_registrations', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Auto-list in Directory</div>
              <div className={styles.settingDesc}>New anchor profiles appear in directory by default</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.directory_auto_list !== 'false'}
                onChange={(e) => update('directory_auto_list', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Free Tier Branding */}
        <div className={styles.settingSection}>
          <h3>Free Tier Branding Watermark</h3>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Watermark Text</div>
              <div className={styles.settingDesc}>Shown in footer on free tier portfolios</div>
            </div>
            <input
              className={styles.settingInput}
              value={settings.branding_watermark_text || 'Powered by StageHost'}
              onChange={(e) => update('branding_watermark_text', e.target.value)}
            />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>Watermark Link URL</div>
            </div>
            <input
              className={styles.settingInput}
              value={settings.branding_watermark_link || 'https://stagehost.in'}
              onChange={(e) => update('branding_watermark_link', e.target.value)}
            />
          </div>
        </div>

        {/* Email Resend Configuration */}
        <div className={styles.settingSection}>
          <h3>Email Notifications (Resend)</h3>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>From Name</div>
            </div>
            <input
              className={styles.settingInput}
              value={settings.email_from_name || 'StageHost'}
              onChange={(e) => update('email_from_name', e.target.value)}
            />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>From Address</div>
            </div>
            <input
              className={styles.settingInput}
              value={settings.email_from_address || 'notifications@stagehost.in'}
              onChange={(e) => update('email_from_address', e.target.value)}
            />
          </div>
          <div style={{ marginTop: 'var(--space-4)', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Test Email Delivery</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                style={{ flex: 1, fontSize: '13px', padding: '6px 10px' }}
                placeholder="Enter email to test (e.g. your email)"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
              />
              <button className="btn btn-ghost btn-sm" onClick={handleSendTestEmail} disabled={isSendingTest}>
                {isSendingTest ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Send Test
              </button>
            </div>
          </div>
        </div>

        {/* Global Announcement Banner (Broadcast) */}
        <div className={styles.settingSection} style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={20} color="var(--color-primary)" />
              <h3 style={{ margin: 0 }}>Platform Announcement Banner (Broadcast)</h3>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveBanner}
              disabled={isSavingBanner}
            >
              {isSavingBanner ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save Broadcast Banner
            </button>
          </div>

          <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-4)' }}>
            Display an urgent alert or feature update at the top of every anchor's dashboard.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            <div className={styles.settingRow} style={{ borderBottom: 'none' }}>
              <div>
                <div className={styles.settingLabel}>Broadcast Active</div>
                <div className={styles.settingDesc}>Turn ON to display across all anchor dashboards</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={banner.is_active}
                  onChange={(e) => setBanner({ ...banner, is_active: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className={styles.settingRow} style={{ borderBottom: 'none' }}>
              <div>
                <div className={styles.settingLabel}>Banner Type</div>
                <div className={styles.settingDesc}>Visual style & accent color</div>
              </div>
              <select
                className="input"
                style={{ width: '150px' }}
                value={banner.type}
                onChange={(e) => setBanner({ ...banner, type: e.target.value as any })}
              >
                <option value="info">Info (Purple/Blue)</option>
                <option value="warning">Alert (Amber/Yellow)</option>
                <option value="success">Success (Emerald Green)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-3)' }}>
            <label className="input-label">Announcement Message</label>
            <textarea
              className="input"
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="e.g. 🚀 StageHost 2.0 is live! You can now customize your hero themes and track direct WhatsApp analytics."
              value={banner.message}
              onChange={(e) => setBanner({ ...banner, message: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
            <div>
              <label className="input-label">Action Link Label (Optional)</label>
              <input
                className="input"
                style={{ width: '100%' }}
                placeholder="e.g. Try New Theme →"
                value={banner.link_text || ''}
                onChange={(e) => setBanner({ ...banner, link_text: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Action Link URL (Optional)</label>
              <input
                className="input"
                style={{ width: '100%' }}
                placeholder="e.g. /themes or https://..."
                value={banner.link_url || ''}
                onChange={(e) => setBanner({ ...banner, link_url: e.target.value })}
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div style={{ marginTop: 'var(--space-4)', padding: '14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
              Live Host Dashboard Preview:
            </div>
            {banner.message ? (
              <div style={{
                background: banner.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : banner.type === 'success'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(99, 102, 241, 0.12)',
                border: `1px solid ${
                  banner.type === 'warning'
                    ? 'rgba(245, 158, 11, 0.3)'
                    : banner.type === 'success'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(99, 102, 241, 0.3)'
                }`,
                color: banner.type === 'warning'
                  ? '#f59e0b'
                  : banner.type === 'success'
                  ? '#10b981'
                  : '#818cf8',
                padding: '10px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Megaphone size={16} />
                  <span>{banner.message}</span>
                  {banner.link_text && (
                    <span style={{ textDecoration: 'underline', fontWeight: 600 }}>
                      {banner.link_text}
                    </span>
                  )}
                </div>
                <span className={`badge badge-${banner.is_active ? 'success' : 'ghost'}`}>
                  {banner.is_active ? 'Status: LIVE' : 'Status: DRAFT'}
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', fontStyle: 'italic' }}>
                Type an announcement message above to preview.
              </div>
            )}
          </div>
        </div>

        {/* CUSTOM DOMAIN & DNS CONFIGURATION */}
        <div className={styles.sectionCard} style={{ marginTop: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="var(--color-primary)" />
              <h3 className={styles.sectionCardTitle} style={{ margin: 0 }}>Custom Domains & DNS Verification</h3>
            </div>
            <span className="badge badge-primary">{customDomains.length} Domains</span>
          </div>

          <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-4)' }}>
            Configure platform DNS targets and verify anchor custom domain mappings (e.g. anchorname.live).
          </p>

          {/* DNS Server Instructions Banner */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-4)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                CNAME Target Record
              </div>
              <code style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>cname.stagehost.in</code>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                A-Record Fallback IP
              </div>
              <code style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 600 }}>76.76.21.21</code>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                SSL Certificate
              </div>
              <span style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>Auto Let's Encrypt Wildcard</span>
            </div>
          </div>

          {/* Domains Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Anchor</th>
                  <th>Custom Domain</th>
                  <th>DNS Type</th>
                  <th>Target Host</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customDomains.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-6)' }}>
                      No custom domain requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  customDomains.map((dom) => (
                    <tr key={dom.id}>
                      <td><strong>{dom.anchor_name}</strong></td>
                      <td>
                        <a
                          href={`https://${dom.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {dom.domain} <ExternalLink size={12} />
                        </a>
                      </td>
                      <td><span className="badge badge-ghost font-mono">{dom.dns_type}</span></td>
                      <td className="font-mono text-xs text-secondary">{dom.dns_target}</td>
                      <td>
                        <span
                          className={`badge badge-${
                            dom.status === 'active' ? 'success' : dom.status === 'rejected' ? 'error' : 'warning'
                          }`}
                        >
                          {dom.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {dom.status !== 'active' && (
                            <button
                              type="button"
                              className="btn btn-xs btn-success"
                              onClick={() => handleDomainStatusChange(dom.id, 'active')}
                              disabled={updatingDomainId === dom.id}
                              title="Verify & mark active"
                            >
                              Approve
                            </button>
                          )}
                          {dom.status !== 'rejected' && (
                            <button
                              type="button"
                              className="btn btn-xs btn-danger"
                              onClick={() => handleDomainStatusChange(dom.id, 'rejected')}
                              disabled={updatingDomainId === dom.id}
                              title="Reject domain request"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

  );
}
