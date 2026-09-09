'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Check, Eye, RotateCcw, Loader2, Crown } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { GLOBAL_SITE_THEMES, type GlobalSiteTheme } from '@/constants/site-themes';
import { setGlobalSiteTheme } from '@/lib/actions/themes';
import styles from './GlobalThemes.module.css';

interface GlobalThemeSwitcherProps {
  initialTheme: string;
}

export function GlobalThemeSwitcher({ initialTheme }: GlobalThemeSwitcherProps) {
  const { success, error: showError } = useToast();
  const [activeThemeId, setActiveThemeId] = useState<string>(initialTheme || 'obsidian-violet');
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [savingThemeId, setSavingThemeId] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<'all' | 'dark' | 'light'>('all');

  // Sync DOM with state on mount if needed
  useEffect(() => {
    const currentAttr = document.documentElement.getAttribute('data-site-theme');
    if (!currentAttr) {
      document.documentElement.setAttribute('data-site-theme', activeThemeId);
    }
  }, [activeThemeId]);

  // Live preview handler — immediately alters CSS variables in the active DOM session
  const handlePreview = (theme: GlobalSiteTheme) => {
    setPreviewThemeId(theme.id);
    document.documentElement.setAttribute('data-site-theme', theme.id);
  };

  // Revert live preview back to currently activated database theme
  const handleRevert = () => {
    document.documentElement.setAttribute('data-site-theme', activeThemeId);
    setPreviewThemeId(null);
  };

  // Save as permanent global site theme
  const handleApply = async (theme: GlobalSiteTheme) => {
    setSavingThemeId(theme.id);
    try {
      // 1. Immediately apply to DOM and local storage
      document.documentElement.setAttribute('data-site-theme', theme.id);
      try {
        localStorage.setItem('stagehost_site_theme', theme.id);
        document.cookie = `stagehost_site_theme=${theme.id}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}

      // 2. Persist to Supabase platform_settings via Server Action
      await setGlobalSiteTheme(theme.id);

      setActiveThemeId(theme.id);
      setPreviewThemeId(null);
      success(`👑 "${theme.name}" (${theme.hindiName}) is now the active theme for the ENTIRE website!`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to apply site theme');
      // Revert DOM on error
      document.documentElement.setAttribute('data-site-theme', activeThemeId);
    } finally {
      setSavingThemeId(null);
    }
  };

  const activeThemeObj = GLOBAL_SITE_THEMES.find((t) => t.id === activeThemeId) || GLOBAL_SITE_THEMES[0];
  const previewThemeObj = previewThemeId ? GLOBAL_SITE_THEMES.find((t) => t.id === previewThemeId) : null;
  const filteredThemes = GLOBAL_SITE_THEMES.filter(
    (t) => modeFilter === 'all' || t.mode === modeFilter
  );

  return (
    <div className={styles.globalThemeSection}>
      {/* Header */}
      <div className={styles.headerTop}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>
              <Sparkles size={22} color="var(--color-primary)" />
              Puri Website Ka Global Theme
            </h2>
            <div className={styles.activeBadgeIndicator}>
              <Crown size={13} /> Active: {activeThemeObj.name}
            </div>
          </div>
          <p className={styles.description}>
            Select the master royal/modern aesthetic for the entire StageHost platform (Landing page, navbar, pricing, directory, dashboard & footer). Supports stunning high-contrast Dark and luminous Light modes.
          </p>
        </div>
      </div>

      {/* Mode Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          type="button"
          className={`${styles.filterTab} ${modeFilter === 'all' ? styles.filterTabActive : ''}`}
          onClick={() => setModeFilter('all')}
        >
          All Themes ({GLOBAL_SITE_THEMES.length})
        </button>
        <button
          type="button"
          className={`${styles.filterTab} ${modeFilter === 'dark' ? styles.filterTabActive : ''}`}
          onClick={() => setModeFilter('dark')}
        >
          🌙 Dark Mode ({GLOBAL_SITE_THEMES.filter((t) => t.mode === 'dark').length})
        </button>
        <button
          type="button"
          className={`${styles.filterTab} ${modeFilter === 'light' ? styles.filterTabActive : ''}`}
          onClick={() => setModeFilter('light')}
        >
          ☀️ Light Mode ({GLOBAL_SITE_THEMES.filter((t) => t.mode === 'light').length})
        </button>
      </div>

      {/* Live Preview Active Notice Banner */}
      {previewThemeObj && previewThemeId !== activeThemeId && (
        <div className={styles.previewNotice}>
          <div className={styles.previewNoticeText}>
            <Eye size={16} />
            <span>
              <strong>Live Previewing:</strong> {previewThemeObj.name} ({previewThemeObj.hindiName}). Your navigation and interface are showing this theme right now!
            </span>
          </div>
          <div className={styles.previewNoticeActions}>
            <button
              type="button"
              className="btn btn-xs btn-primary"
              onClick={() => handleApply(previewThemeObj)}
              disabled={savingThemeId !== null}
            >
              {savingThemeId === previewThemeObj.id ? <Loader2 size={12} className="spin" /> : <Check size={12} />}
              Apply for Everyone
            </button>
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={handleRevert}
              title="Revert back to active theme"
            >
              <RotateCcw size={12} /> Revert
            </button>
          </div>
        </div>
      )}

      {/* Themes Grid */}
      <div className={styles.themesGrid}>
        {filteredThemes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          const isPreviewingThis = previewThemeId === theme.id;
          const isSavingThis = savingThemeId === theme.id;

          return (
            <div
              key={theme.id}
              className={`${styles.themeCard} ${isActive ? styles.isActive : ''}`}
              style={{
                // Custom CSS variables for hover glow
                ['--card-glow' as any]: theme.glow,
                ['--card-border-hover' as any]: theme.primary,
                ['--theme-primary' as any]: theme.primary,
              }}
              onClick={() => {
                if (!isActive) handlePreview(theme);
              }}
            >
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.themeTitleArea}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span
                      className={styles.themeBadge}
                      style={{
                        background: `${theme.primary}20`,
                        color: theme.primary,
                        border: `1px solid ${theme.primary}40`,
                        marginBottom: 0,
                      }}
                    >
                      {theme.badge}
                    </span>
                    <span className={styles.modeTag}>
                      {theme.mode === 'light' ? '☀️ Light' : '🌙 Dark'}
                    </span>
                  </div>
                  <h3 className={styles.themeName}>{theme.name}</h3>
                  <div className={styles.themeHindi}>{theme.hindiName}</div>
                </div>

                {isActive && (
                  <span className={styles.cardActivePill}>
                    <Check size={12} /> Active Website
                  </span>
                )}
              </div>

              {/* Mini Browser UI Mockup */}
              <div
                className={styles.mockupContainer}
                style={{
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div
                  className={styles.mockupBrowserBar}
                  style={{
                    background: theme.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.45)',
                    borderBottom: `1px solid ${theme.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)'}`,
                  }}
                >
                  <span className={styles.mockupDot} style={{ background: '#FF5F56' }} />
                  <span className={styles.mockupDot} style={{ background: '#FFBD2E' }} />
                  <span className={styles.mockupDot} style={{ background: '#27C93F' }} />
                </div>

                <div className={styles.mockupBody} style={{ background: theme.previewGradient }}>
                  {/* Mockup Mini Navbar */}
                  <div className={styles.mockupNav}>
                    <div className={styles.mockupLogo} style={{ color: theme.primary }}>
                      <Sparkles size={9} /> StageHost
                    </div>
                    <div
                      className={styles.mockupNavBtn}
                      style={{
                        background: `${theme.primary}20`,
                        color: theme.primary,
                        border: `1px solid ${theme.primary}50`,
                      }}
                    >
                      Login
                    </div>
                  </div>

                  {/* Mockup Mini Hero */}
                  <div className={styles.mockupHero}>
                    <div
                      className={styles.mockupHeading}
                      style={{ color: theme.mode === 'light' ? '#0F172A' : '#FFFFFF' }}
                    >
                      Your Stage. <span style={{ color: theme.primary }}>Your Brand.</span>
                    </div>
                    <div
                      className={styles.mockupSubtext}
                      style={{ color: theme.mode === 'light' ? '#475569' : '#B0B0C0' }}
                    >
                      The #1 portfolio platform for event emcees
                    </div>
                    <div className={styles.mockupActions}>
                      <div
                        className={styles.mockupCta}
                        style={{
                          background: theme.primary,
                          color: (theme.id === 'midnight-gold' || theme.id === 'ivory-gold') ? '#07070B' : '#FFFFFF',
                        }}
                      >
                        Get Started Free
                      </div>
                      <div
                        className={styles.mockupSecondary}
                        style={{
                          background: theme.cardBg,
                          color: theme.mode === 'light' ? '#334155' : '#E0E0E0',
                          border: theme.mode === 'light' ? '1px solid rgba(0,0,0,0.12)' : 'none',
                        }}
                      >
                        Explore Anchors
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Description */}
              <p className={styles.themeDesc}>{theme.description}</p>

              {/* Palette Color Swatches */}
              <div className={styles.swatchesRow}>
                <span className={styles.swatchLabel}>Palette</span>
                <div className={styles.swatchesList}>
                  <span
                    className={styles.swatchCircle}
                    style={{ background: theme.primary }}
                    title={`Primary: ${theme.primary}`}
                  />
                  <span
                    className={styles.swatchCircle}
                    style={{ background: theme.accent }}
                    title={`Accent: ${theme.accent}`}
                  />
                  <span
                    className={styles.swatchCircle}
                    style={{ background: theme.cardBg }}
                    title={`Card: ${theme.cardBg}`}
                  />
                  <span
                    className={styles.swatchCircle}
                    style={{ background: theme.bg }}
                    title={`Deep BG: ${theme.bg}`}
                  />
                </div>
              </div>

              {/* Features Pills */}
              <div className={styles.featuresRow}>
                {theme.features.map((feat, idx) => (
                  <span key={idx} className={styles.featurePill}>
                    {feat}
                  </span>
                ))}
              </div>

              {/* Footer Actions */}
              <div
                className={styles.cardFooter}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={styles.btnPreview}
                  onClick={() => handlePreview(theme)}
                  title="Test on screen right now"
                >
                  <Eye size={13} />
                  {isPreviewingThis ? 'Previewing' : 'Live Preview'}
                </button>

                <button
                  type="button"
                  className={styles.btnApply}
                  style={{
                    background: isActive ? 'var(--color-bg-tertiary)' : theme.primary,
                    color: isActive ? 'var(--color-text-tertiary)' : (theme.id === 'midnight-gold' ? '#07070B' : '#FFFFFF'),
                  }}
                  onClick={() => handleApply(theme)}
                  disabled={isActive || isSavingThis}
                >
                  {isSavingThis ? (
                    <>
                      <Loader2 size={13} className="spin" /> Applying...
                    </>
                  ) : isActive ? (
                    <>
                      <Check size={13} /> Active Master Theme
                    </>
                  ) : (
                    <>
                      <Crown size={13} /> Apply to Entire Website
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
