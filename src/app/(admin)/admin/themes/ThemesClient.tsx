'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, X, Save, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  createAdminTheme,
  deleteAdminTheme,
  toggleThemeStatus,
  updateAdminTheme,
  updateThemeTierAllocation,
} from '@/lib/actions/admin';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { GlobalThemeSwitcher } from './GlobalThemeSwitcher';
import styles from '../dashboard/admin.module.css';

export interface ThemeItem {
  id: string;
  name: string;
  slug: string;
  primary: string;
  bg: string;
  min_plan_tier: number;
  available_from: string;
  active: boolean;
}

interface ThemesClientProps {
  initialThemes: ThemeItem[];
  initialSiteTheme?: string;
}

export function ThemesClient({ initialThemes, initialSiteTheme }: ThemesClientProps) {
  const { success, error: showError } = useToast();
  const [themes, setThemes] = useState<ThemeItem[]>(initialThemes);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeItem | null>(null);
  const [deletingTheme, setDeletingTheme] = useState<{ themeId: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // New Theme Form State
  const [newTheme, setNewTheme] = useState({
    name: '',
    category: 'dark',
    primaryColor: '#6C5CE7',
    bgColor: '#0A0A14',
    minPlanTier: 0,
  });

  // Toggle Active State
  const handleToggleActive = (themeId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    startTransition(async () => {
      try {
        await toggleThemeStatus(themeId, nextStatus);
        setThemes(prev => prev.map(t => t.id === themeId ? { ...t, active: nextStatus } : t));
        success(nextStatus ? 'Theme activated!' : 'Theme deactivated');
      } catch (err) {
        showError('Failed to toggle theme');
      }
    });
  };

  // Quick Plan Tier Allocation Change on Card
  const handleTierChange = (themeId: string, tier: number) => {
    startTransition(async () => {
      try {
        await updateThemeTierAllocation(themeId, tier);
        const tierName = tier === 0 ? 'free' : tier === 1 ? 'starter' : tier === 2 ? 'pro' : 'premium';
        setThemes(prev => prev.map(t => t.id === themeId ? {
          ...t,
          min_plan_tier: tier,
          available_from: tierName,
        } : t));
        success('Plan allocation updated successfully!');
      } catch (err) {
        showError('Failed to update plan allocation');
      }
    });
  };

  // Delete Theme
  const confirmDeleteTheme = () => {
    if (!deletingTheme) return;
    const { themeId, name } = deletingTheme;
    startTransition(async () => {
      try {
        await deleteAdminTheme(themeId);
        setThemes(prev => prev.filter(t => t.id !== themeId));
        success(`Theme "${name}" deleted`);
        setDeletingTheme(null);
      } catch (err) {
        showError('Failed to delete theme');
      }
    });
  };

  // Save Edited Theme
  const handleSaveEditedTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTheme) return;

    startTransition(async () => {
      try {
        await updateAdminTheme(editingTheme.id, {
          name: editingTheme.name,
          primaryColor: editingTheme.primary,
          bgColor: editingTheme.bg,
          minPlanTier: editingTheme.min_plan_tier,
        });

        const tierName = editingTheme.min_plan_tier === 0 ? 'free' : editingTheme.min_plan_tier === 1 ? 'starter' : editingTheme.min_plan_tier === 2 ? 'pro' : 'premium';

        setThemes(prev => prev.map(t => t.id === editingTheme.id ? {
          ...editingTheme,
          available_from: tierName,
        } : t));

        success(`Theme "${editingTheme.name}" updated in database!`);
        setEditingTheme(null);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to update theme');
      }
    });
  };

  // Create New Theme
  const handleCreateTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.name) return;

    startTransition(async () => {
      try {
        await createAdminTheme(newTheme);
        const tierName = newTheme.minPlanTier === 0 ? 'free' : newTheme.minPlanTier === 1 ? 'starter' : newTheme.minPlanTier === 2 ? 'pro' : 'premium';
        setThemes(prev => [
          ...prev,
          {
            id: 'theme_' + Date.now(),
            name: newTheme.name,
            slug: newTheme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            primary: newTheme.primaryColor,
            bg: newTheme.bgColor,
            min_plan_tier: newTheme.minPlanTier,
            available_from: tierName,
            active: true,
          }
        ]);
        success(`Theme "${newTheme.name}" created successfully!`);
        setIsAddModalOpen(false);
        setNewTheme({ name: '', category: 'dark', primaryColor: '#6C5CE7', bgColor: '#0A0A14', minPlanTier: 0 });
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to create theme');
      }
    });
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Themes & Website Styling</h1>
          <p className={styles.pageSubtitle}>
            Configure the global website master theme and customize anchor portfolio theme allocations
          </p>
        </div>
      </div>

      {/* 1. GLOBAL WEBSITE THEME (Puri Website Ka Theme) */}
      <GlobalThemeSwitcher initialTheme={initialSiteTheme || 'obsidian-violet'} />

      {/* 2. ANCHOR PORTFOLIO THEMES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-primary)' }}>
            Anchor Portfolio Themes
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Themes available to individual anchors for their public profiles and tier locks
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={14} /> Add Portfolio Theme
        </button>
      </div>

      <div className={styles.plansGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {themes.map(theme => (
          <div key={theme.id} className={styles.planCard} style={{ opacity: theme.active ? 1 : 0.6 }}>
            {/* Visual Color Preview */}
            <div style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: 'var(--radius-md)',
              background: theme.bg,
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '12px',
              gap: '6px',
              position: 'relative',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
            }}>
              <div style={{ height: '6px', width: '70%', borderRadius: '99px', background: theme.primary }} />
              <div style={{ height: '6px', width: '45%', borderRadius: '99px', background: `${theme.primary}66` }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
              <div>
                <div className={styles.planCardName} style={{ fontSize: '15px' }}>{theme.name}</div>
                <div className="text-xs text-tertiary">/{theme.slug}</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setEditingTheme({ ...theme })}
                  title="Edit Theme & Colors"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ color: 'var(--color-error)' }}
                  onClick={() => setDeletingTheme({ themeId: theme.id, name: theme.name })}
                  disabled={isPending}
                  title="Delete Theme"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Status & Availability Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
              <span className="badge badge-success" style={{ fontSize: '11px', padding: '3px 8px' }}>
                Open for All Plans
              </span>
              <button
                className={`badge badge-${theme.active ? 'primary' : 'ghost'}`}
                style={{ cursor: 'pointer', border: 'none', fontSize: '11px', padding: '2px 8px' }}
                onClick={() => handleToggleActive(theme.id, theme.active)}
                disabled={isPending}
                title="Click to toggle active/disabled"
              >
                {theme.active ? 'Active' : 'Disabled'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Theme Modal */}
      {editingTheme && (
        <div className="modal-backdrop" onClick={() => setEditingTheme(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Edit Theme: {editingTheme.name}</h3>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditingTheme(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEditedTheme}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Live Preview Box */}
                <div style={{
                  width: '100%',
                  height: '80px',
                  borderRadius: '10px',
                  background: editingTheme.bg,
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{ width: '60px', height: '8px', borderRadius: '4px', background: editingTheme.primary }} />
                  <span style={{ fontSize: '11px', color: editingTheme.bg.toLowerCase() === '#ffffff' ? '#000' : '#fff' }}>
                    Live Preview: {editingTheme.name}
                  </span>
                </div>

                <div className="input-group">
                  <label className="input-label">Theme Name *</label>
                  <input
                    required
                    className="input"
                    value={editingTheme.name}
                    onChange={e => setEditingTheme({ ...editingTheme, name: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Primary Accent Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      style={{ width: '42px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      value={editingTheme.primary}
                      onChange={e => setEditingTheme({ ...editingTheme, primary: e.target.value })}
                    />
                    <input
                      className="input"
                      value={editingTheme.primary}
                      onChange={e => setEditingTheme({ ...editingTheme, primary: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Background Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      style={{ width: '42px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      value={editingTheme.bg}
                      onChange={e => setEditingTheme({ ...editingTheme, bg: e.target.value })}
                    />
                    <input
                      className="input"
                      value={editingTheme.bg}
                      onChange={e => setEditingTheme({ ...editingTheme, bg: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingTheme(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Theme Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Create New Theme</h3>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTheme}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="input-group">
                  <label className="input-label">Theme Name *</label>
                  <input
                    required
                    className="input"
                    placeholder="e.g. Velvet Noir"
                    value={newTheme.name}
                    onChange={e => setNewTheme({ ...newTheme, name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Primary Accent Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      style={{ width: '42px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      value={newTheme.primaryColor}
                      onChange={e => setNewTheme({ ...newTheme, primaryColor: e.target.value })}
                    />
                    <input
                      className="input"
                      value={newTheme.primaryColor}
                      onChange={e => setNewTheme({ ...newTheme, primaryColor: e.target.value })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Background Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      style={{ width: '42px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      value={newTheme.bgColor}
                      onChange={e => setNewTheme({ ...newTheme, bgColor: e.target.value })}
                    />
                    <input
                      className="input"
                      value={newTheme.bgColor}
                      onChange={e => setNewTheme({ ...newTheme, bgColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Create Theme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Theme Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingTheme}
        onClose={() => setDeletingTheme(null)}
        onConfirm={confirmDeleteTheme}
        title={`Delete Theme "${deletingTheme?.name}"?`}
        description="Are you sure you want to remove this theme? Anchors using this theme will fallback to the obsidian night theme."
        confirmText="Delete Theme"
        cancelText="Cancel"
        variant="danger"
        isLoading={isPending}
      />
    </div>
  );
}
