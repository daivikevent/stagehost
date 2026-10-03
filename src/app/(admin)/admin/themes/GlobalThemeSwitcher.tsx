'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  Eye,
  RotateCcw,
  Loader2,
  Crown,
  Edit2,
  Trash2,
  Plus,
  X,
  Palette,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { GLOBAL_SITE_THEMES, type GlobalSiteTheme } from '@/constants/site-themes';
import {
  setGlobalSiteTheme,
  saveCustomSiteThemes,
  resetCustomSiteThemesToDefault,
} from '@/lib/actions/themes';
import styles from './GlobalThemes.module.css';

interface GlobalThemeSwitcherProps {
  initialTheme: string;
  initialThemesList?: GlobalSiteTheme[];
}

export function GlobalThemeSwitcher({
  initialTheme,
  initialThemesList,
}: GlobalThemeSwitcherProps) {
  const { success, error: showError } = useToast();
  const [themesList, setThemesList] = useState<GlobalSiteTheme[]>(
    initialThemesList && initialThemesList.length > 0 ? initialThemesList : GLOBAL_SITE_THEMES
  );
  const [activeThemeId, setActiveThemeId] = useState<string>(initialTheme || 'indigo-sapphire-aura');
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [savingThemeId, setSavingThemeId] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<'all' | 'dark' | 'light'>('all');

  // Modals state
  const [editingTheme, setEditingTheme] = useState<GlobalSiteTheme | null>(null);
  const [deletingTheme, setDeletingTheme] = useState<GlobalSiteTheme | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  // New Theme form state
  const [newThemeData, setNewThemeData] = useState<Partial<GlobalSiteTheme>>({
    name: 'Custom Royal Stage',
    badge: '⚡ Custom VIP',
    category: 'royal',
    mode: 'dark',
    description: 'Custom theme tailored with personalized stage and button colors.',
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    accent: '#2563EB',
    bg: '#070814',
    cardBg: '#0F1226',
    border: 'rgba(99, 102, 241, 0.22)',
    glow: 'rgba(99, 102, 241, 0.45)',
    features: ['Custom Stage Palette', 'Purple / Blue CTAs', 'High Contrast'],
  });

  // Dynamic style injector for edited or custom themes
  const injectThemeVariables = (theme: GlobalSiteTheme) => {
    let styleEl = document.getElementById('bma-dynamic-theme-vars') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'bma-dynamic-theme-vars';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      html[data-site-theme="${theme.id}"],
      :root[data-site-theme="${theme.id}"] {
        --color-primary: ${theme.primary};
        --color-primary-hover: ${theme.primaryHover};
        --color-accent: ${theme.accent};
        --color-bg-primary: ${theme.bg};
        --color-bg-card: ${theme.cardBg};
        --color-border: ${theme.border};
        --color-primary-glow: ${theme.glow};
      }
      html[data-site-theme="${theme.id}"] .btn-primary {
        background: ${theme.primary} !important;
        border-color: ${theme.primary} !important;
      }
      html[data-site-theme="${theme.id}"] .btn-accent {
        background: ${theme.accent} !important;
        border-color: ${theme.accent} !important;
      }
    `;
  };

  // Sync DOM with state on mount
  useEffect(() => {
    const currentAttr = document.documentElement.getAttribute('data-site-theme');
    if (!currentAttr) {
      document.documentElement.setAttribute('data-site-theme', activeThemeId);
    }
  }, [activeThemeId]);

  // Live preview handler
  const handlePreview = (theme: GlobalSiteTheme) => {
    setPreviewThemeId(theme.id);
    injectThemeVariables(theme);
    document.documentElement.setAttribute('data-site-theme', theme.id);
  };

  // Revert live preview back to currently activated database theme
  const handleRevert = () => {
    const activeObj = themesList.find((t) => t.id === activeThemeId);
    if (activeObj) injectThemeVariables(activeObj);
    document.documentElement.setAttribute('data-site-theme', activeThemeId);
    setPreviewThemeId(null);
  };

  // Save as permanent global site theme
  const handleApply = async (theme: GlobalSiteTheme) => {
    setSavingThemeId(theme.id);
    try {
      injectThemeVariables(theme);
      document.documentElement.setAttribute('data-site-theme', theme.id);
      try {
        localStorage.setItem('bookmyartist_site_theme', theme.id);
        localStorage.setItem('stagehost_site_theme', theme.id);
        document.cookie = `bookmyartist_site_theme=${theme.id}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `stagehost_site_theme=${theme.id}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}

      await setGlobalSiteTheme(theme.id);

      setActiveThemeId(theme.id);
      setPreviewThemeId(null);
      success(`👑 "${theme.name}" is now the active theme for the entire website!`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to apply site theme');
      document.documentElement.setAttribute('data-site-theme', activeThemeId);
    } finally {
      setSavingThemeId(null);
    }
  };

  // Save edited theme
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTheme) return;

    setIsSavingCustom(true);
    try {
      const updatedList = themesList.map((t) =>
        t.id === editingTheme.id ? { ...editingTheme } : t
      );
      setThemesList(updatedList);
      await saveCustomSiteThemes(updatedList);

      if (activeThemeId === editingTheme.id || previewThemeId === editingTheme.id) {
        injectThemeVariables(editingTheme);
      }

      success(`Theme "${editingTheme.name}" updated successfully!`);
      setEditingTheme(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save theme changes');
    } finally {
      setIsSavingCustom(false);
    }
  };

  // Confirm delete theme
  const handleConfirmDelete = async () => {
    if (!deletingTheme) return;
    if (deletingTheme.id === activeThemeId) {
      showError('Cannot delete the currently active theme! Please activate another theme first.');
      setDeletingTheme(null);
      return;
    }

    setIsSavingCustom(true);
    try {
      const updatedList = themesList.filter((t) => t.id !== deletingTheme.id);
      setThemesList(updatedList);
      await saveCustomSiteThemes(updatedList);

      if (previewThemeId === deletingTheme.id) {
        handleRevert();
      }

      success(`Theme "${deletingTheme.name}" deleted successfully.`);
      setDeletingTheme(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete theme');
    } finally {
      setIsSavingCustom(false);
    }
  };

  // Create new custom theme
  const handleCreateCustomTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCustom(true);

    try {
      const id = `custom-${Date.now().toString(36)}`;
      const createdTheme: GlobalSiteTheme = {
        id,
        name: newThemeData.name || 'Custom Theme',
        badge: newThemeData.badge || '⚡ Custom',
        category: (newThemeData.category as any) || 'royal',
        mode: (newThemeData.mode as any) || 'dark',
        description: newThemeData.description || 'Custom tailored platform theme.',
        primary: newThemeData.primary || '#6366F1',
        primaryHover: newThemeData.primaryHover || '#4F46E5',
        accent: newThemeData.accent || '#2563EB',
        bg: newThemeData.bg || '#070814',
        cardBg: newThemeData.cardBg || '#0F1226',
        border: newThemeData.border || 'rgba(99, 102, 241, 0.22)',
        glow: newThemeData.glow || 'rgba(99, 102, 241, 0.45)',
        previewGradient: `linear-gradient(135deg, ${newThemeData.primary} 0%, ${newThemeData.accent} 100%)`,
        previewColors: [
          newThemeData.primary || '#6366F1',
          newThemeData.accent || '#2563EB',
          newThemeData.cardBg || '#0F1226',
          newThemeData.bg || '#070814',
        ],
        features: newThemeData.features || ['Custom Palette', 'High Contrast'],
      };

      const updatedList = [createdTheme, ...themesList];
      setThemesList(updatedList);
      await saveCustomSiteThemes(updatedList);

      success(`New theme "${createdTheme.name}" created! You can now preview or apply it.`);
      setIsCreateModalOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create custom theme');
    } finally {
      setIsSavingCustom(false);
    }
  };

  // Restore factory default themes
  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all themes back to original factory defaults? Any custom edits will be restored.')) {
      return;
    }

    setIsSavingCustom(true);
    try {
      await resetCustomSiteThemesToDefault();
      setThemesList(GLOBAL_SITE_THEMES);
      success('Factory default themes restored successfully!');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to reset themes');
    } finally {
      setIsSavingCustom(false);
    }
  };

  const activeThemeObj = themesList.find((t) => t.id === activeThemeId) || themesList[0] || GLOBAL_SITE_THEMES[0];
  const previewThemeObj = previewThemeId ? themesList.find((t) => t.id === previewThemeId) : null;
  const filteredThemes = themesList.filter(
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
              Global Website Theme
            </h2>
            <div className={styles.activeBadgeIndicator}>
              <Crown size={13} /> Active: {activeThemeObj.name}
            </div>
          </div>
          <p className={styles.description}>
            Select, customize, or create the master aesthetic for the entire BookMyArtist platform (Landing page, navbar, pricing, directory, dashboard &amp; footer). Buttons are styled in regal purple and sapphire blue tones with subtle accent highlights.
          </p>
        </div>
      </div>

      {/* Header Controls (Filter Tabs + Action Buttons) */}
      <div className={styles.headerControls}>
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterTab} ${modeFilter === 'all' ? styles.filterTabActive : ''}`}
            onClick={() => setModeFilter('all')}
          >
            All Themes ({themesList.length})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${modeFilter === 'dark' ? styles.filterTabActive : ''}`}
            onClick={() => setModeFilter('dark')}
          >
            🌙 Dark Mode ({themesList.filter((t) => t.mode === 'dark').length})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${modeFilter === 'light' ? styles.filterTabActive : ''}`}
            onClick={() => setModeFilter('light')}
          >
            ☀️ Light Mode ({themesList.filter((t) => t.mode === 'light').length})
          </button>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnAddTheme}
            onClick={() => setIsCreateModalOpen(true)}
            title="Create a new custom theme"
          >
            <Plus size={14} /> Add Custom Theme
          </button>
          <button
            type="button"
            className={styles.btnResetThemes}
            onClick={handleResetDefaults}
            title="Restore factory themes"
          >
            <RotateCcw size={13} /> Reset Defaults
          </button>
        </div>
      </div>

      {/* Live Preview Active Notice Banner */}
      {previewThemeObj && previewThemeId !== activeThemeId && (
        <div className={styles.previewNotice}>
          <div className={styles.previewNoticeText}>
            <Eye size={16} />
            <span>
              <strong>Live Previewing:</strong> {previewThemeObj.name}. Your navigation and interface are showing this theme right now!
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
                </div>

                <div className={styles.cardTools} onClick={(e) => e.stopPropagation()}>
                  {isActive && (
                    <span className={styles.cardActivePill}>
                      <Check size={12} /> Active Website
                    </span>
                  )}
                  {/* Edit Theme Button */}
                  <button
                    type="button"
                    className={`${styles.cardToolBtn} ${styles.editBtn}`}
                    onClick={() => setEditingTheme({ ...theme })}
                    title={`Edit ${theme.name}`}
                  >
                    <Edit2 size={13} />
                  </button>
                  {/* Delete Theme Button */}
                  <button
                    type="button"
                    className={`${styles.cardToolBtn} ${styles.deleteBtn}`}
                    onClick={() => setDeletingTheme(theme)}
                    disabled={isActive}
                    title={isActive ? 'Cannot delete active theme' : `Delete ${theme.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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
                  <div className={styles.mockupNav}>
                    <div className={styles.mockupLogo} style={{ color: theme.primary }}>
                      <Sparkles size={9} /> BookMyArtist
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

                  <div className={styles.mockupHero}>
                    <div
                      className={styles.mockupHeading}
                      style={{ color: theme.mode === 'light' ? '#0F172A' : '#FFFFFF' }}
                    >
                      Your Talent. <span style={{ color: theme.primary }}>Your Brand.</span>
                    </div>
                    <div
                      className={styles.mockupSubtext}
                      style={{ color: theme.mode === 'light' ? '#475569' : '#B0B0C0' }}
                    >
                      The #1 portfolio platform for live artists &amp; performers
                    </div>
                    <div className={styles.mockupActions}>
                      <div
                        className={styles.mockupCta}
                        style={{
                          background: theme.primary,
                          color: '#FFFFFF',
                        }}
                      >
                        Get Started Free
                      </div>
                      <div
                        className={styles.mockupSecondary}
                        style={{
                          background: theme.accent,
                          color: '#FFFFFF',
                        }}
                      >
                        Explore Artists
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
                    title={`Primary (Buttons): ${theme.primary}`}
                  />
                  <span
                    className={styles.swatchCircle}
                    style={{ background: theme.accent }}
                    title={`Accent (CTAs): ${theme.accent}`}
                  />
                  <span
                    className={styles.swatchCircle}
                    style={{ background: theme.cardBg }}
                    title={`Card Surface: ${theme.cardBg}`}
                  />
                  <span
                    className={styles.swatchCircle}
                    style={{ background: theme.bg }}
                    title={`Deep Canvas: ${theme.bg}`}
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
                    color: '#FFFFFF',
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

      {/* EDIT THEME MODAL */}
      {editingTheme && (
        <div className={styles.modalOverlay} onClick={() => setEditingTheme(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Edit2 size={16} color="var(--color-primary)" />
                Edit Theme: {editingTheme.name}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditingTheme(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className={styles.modalBody}>
                {/* Live Swatch Preview */}
                <div className={styles.liveSwatchBox}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#aaa' }}>Live Swatch:</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: editingTheme.primary }} title="Primary Button" />
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: editingTheme.accent }} title="Accent Button" />
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: editingTheme.cardBg }} title="Card Background" />
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: editingTheme.bg }} title="Canvas Background" />
                  </div>
                  <span style={{ fontSize: '11px', color: editingTheme.primary, fontWeight: 700, marginLeft: 'auto' }}>
                    {editingTheme.badge}
                  </span>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Theme Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingTheme.name}
                      onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Badge Label</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingTheme.badge}
                      onChange={(e) => setEditingTheme({ ...editingTheme, badge: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <select
                      className={styles.formSelect}
                      value={editingTheme.category}
                      onChange={(e) => setEditingTheme({ ...editingTheme, category: e.target.value as any })}
                    >
                      <option value="royal">Royal</option>
                      <option value="modern">Modern</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mode</label>
                    <select
                      className={styles.formSelect}
                      value={editingTheme.mode}
                      onChange={(e) => setEditingTheme({ ...editingTheme, mode: e.target.value as any })}
                    >
                      <option value="dark">Dark Mode</option>
                      <option value="light">Light Mode</option>
                    </select>
                  </div>

                  {/* Primary Color (Buttons) */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Primary Button Color</label>
                    <div className={styles.colorPickerRow}>
                      <input
                        type="color"
                        className={styles.colorWheelInput}
                        value={editingTheme.primary.startsWith('#') ? editingTheme.primary : '#6366F1'}
                        onChange={(e) => setEditingTheme({
                          ...editingTheme,
                          primary: e.target.value,
                          primaryHover: e.target.value,
                        })}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ flex: 1 }}
                        value={editingTheme.primary}
                        onChange={(e) => setEditingTheme({ ...editingTheme, primary: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Secondary / Accent Color */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Secondary CTA Color</label>
                    <div className={styles.colorPickerRow}>
                      <input
                        type="color"
                        className={styles.colorWheelInput}
                        value={editingTheme.accent.startsWith('#') ? editingTheme.accent : '#2563EB'}
                        onChange={(e) => setEditingTheme({ ...editingTheme, accent: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ flex: 1 }}
                        value={editingTheme.accent}
                        onChange={(e) => setEditingTheme({ ...editingTheme, accent: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Canvas Background */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Background Canvas</label>
                    <div className={styles.colorPickerRow}>
                      <input
                        type="color"
                        className={styles.colorWheelInput}
                        value={editingTheme.bg.startsWith('#') ? editingTheme.bg : '#070814'}
                        onChange={(e) => setEditingTheme({ ...editingTheme, bg: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ flex: 1 }}
                        value={editingTheme.bg}
                        onChange={(e) => setEditingTheme({ ...editingTheme, bg: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Card Surface */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Card Surface Color</label>
                    <div className={styles.colorPickerRow}>
                      <input
                        type="color"
                        className={styles.colorWheelInput}
                        value={editingTheme.cardBg.startsWith('#') ? editingTheme.cardBg : '#0F1226'}
                        onChange={(e) => setEditingTheme({ ...editingTheme, cardBg: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ flex: 1 }}
                        value={editingTheme.cardBg}
                        onChange={(e) => setEditingTheme({ ...editingTheme, cardBg: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    rows={2}
                    className={styles.formTextarea}
                    value={editingTheme.description}
                    onChange={(e) => setEditingTheme({ ...editingTheme, description: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setEditingTheme(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={isSavingCustom}
                >
                  {isSavingCustom ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CUSTOM THEME MODAL */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Plus size={16} color="var(--color-primary)" />
                Create New Custom Theme
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTheme}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Theme Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={newThemeData.name || ''}
                      onChange={(e) => setNewThemeData({ ...newThemeData, name: e.target.value })}
                      placeholder="e.g. Royal Sapphire Luxe"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Badge Label</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={newThemeData.badge || ''}
                      onChange={(e) => setNewThemeData({ ...newThemeData, badge: e.target.value })}
                      placeholder="e.g. ⚡ VIP Edition"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <select
                      className={styles.formSelect}
                      value={newThemeData.category}
                      onChange={(e) => setNewThemeData({ ...newThemeData, category: e.target.value as any })}
                    >
                      <option value="royal">Royal</option>
                      <option value="modern">Modern</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mode</label>
                    <select
                      className={styles.formSelect}
                      value={newThemeData.mode}
                      onChange={(e) => setNewThemeData({ ...newThemeData, mode: e.target.value as any })}
                    >
                      <option value="dark">Dark Mode</option>
                      <option value="light">Light Mode</option>
                    </select>
                  </div>

                  {/* Primary Color */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Primary Button Color</label>
                    <div className={styles.colorPickerRow}>
                      <input
                        type="color"
                        className={styles.colorWheelInput}
                        value={newThemeData.primary || '#6366F1'}
                        onChange={(e) => setNewThemeData({
                          ...newThemeData,
                          primary: e.target.value,
                          primaryHover: e.target.value,
                        })}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ flex: 1 }}
                        value={newThemeData.primary || ''}
                        onChange={(e) => setNewThemeData({ ...newThemeData, primary: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Secondary CTA Color */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Secondary CTA Color</label>
                    <div className={styles.colorPickerRow}>
                      <input
                        type="color"
                        className={styles.colorWheelInput}
                        value={newThemeData.accent || '#2563EB'}
                        onChange={(e) => setNewThemeData({ ...newThemeData, accent: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ flex: 1 }}
                        value={newThemeData.accent || ''}
                        onChange={(e) => setNewThemeData({ ...newThemeData, accent: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Canvas Background */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Background Canvas</label>
                    <div className={styles.colorPickerRow}>
                      <input
                        type="color"
                        className={styles.colorWheelInput}
                        value={newThemeData.bg || '#070814'}
                        onChange={(e) => setNewThemeData({ ...newThemeData, bg: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ flex: 1 }}
                        value={newThemeData.bg || ''}
                        onChange={(e) => setNewThemeData({ ...newThemeData, bg: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Card Surface */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Card Surface Color</label>
                    <div className={styles.colorPickerRow}>
                      <input
                        type="color"
                        className={styles.colorWheelInput}
                        value={newThemeData.cardBg || '#0F1226'}
                        onChange={(e) => setNewThemeData({ ...newThemeData, cardBg: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ flex: 1 }}
                        value={newThemeData.cardBg || ''}
                        onChange={(e) => setNewThemeData({ ...newThemeData, cardBg: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    rows={2}
                    className={styles.formTextarea}
                    value={newThemeData.description || ''}
                    onChange={(e) => setNewThemeData({ ...newThemeData, description: e.target.value })}
                    placeholder="Short description of this aesthetic..."
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={isSavingCustom}
                >
                  {isSavingCustom ? <Loader2 size={13} className="spin" /> : <Plus size={13} />}
                  Create Theme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTheme && (
        <div className={styles.modalOverlay} onClick={() => setDeletingTheme(null)}>
          <div className={styles.modalContent} style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#EF4444' }}>
                <AlertTriangle size={18} color="#EF4444" />
                Delete Theme
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDeletingTheme(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>
                Are you sure you want to delete the theme <strong>&quot;{deletingTheme.name}&quot;</strong>? It will be removed from the platform theme choices.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setDeletingTheme(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                style={{ background: '#EF4444', borderColor: '#EF4444', color: '#fff' }}
                onClick={handleConfirmDelete}
                disabled={isSavingCustom}
              >
                {isSavingCustom ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
