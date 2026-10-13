'use client';

import React, { useState, useTransition } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Loader2,
  Sparkles,
  Music,
  Mic,
  Globe,
  MapPin,
  Building,
  CreditCard,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  savePlatformTaxonomy,
  resetTaxonomyToDefault,
} from '@/lib/actions/taxonomy';
import { PlatformTaxonomy } from '@/types/taxonomy';
import { ArtistCategory } from '@/constants/artists';
import styles from './TaxonomySettingsCard.module.css';

interface TaxonomySettingsCardProps {
  initialTaxonomy: PlatformTaxonomy;
}

type TabKey = keyof PlatformTaxonomy;

const TABS: Array<{ key: TabKey; label: string; icon: React.ElementType }> = [
  { key: 'categories', label: 'Artist Categories', icon: Music },
  { key: 'eventTypes', label: 'Event Types & Occasions', icon: Mic },
  { key: 'languages', label: 'Languages', icon: Globe },
  { key: 'cities', label: 'Supported Cities', icon: MapPin },
  { key: 'specialties', label: 'Skills & Specialties', icon: Sparkles },
  { key: 'clientBrands', label: 'Client Luxury Brands', icon: Building },
  { key: 'budgetRanges', label: 'Inquiry Budget Slabs', icon: CreditCard },
];

export function TaxonomySettingsCard({ initialTaxonomy }: TaxonomySettingsCardProps) {
  const { success, error: showError } = useToast();
  const [taxonomy, setTaxonomy] = useState<PlatformTaxonomy>(initialTaxonomy);
  const [activeTab, setActiveTab] = useState<TabKey>('categories');
  const [newItemText, setNewItemText] = useState('');
  const [isPending, startTransition] = useTransition();

  // Category creation form state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCat, setNewCat] = useState<Partial<ArtistCategory>>({
    id: '',
    label: '',
    shortLabel: '',
    hindiName: '',
    emoji: '🎭',
    badge: 'Verified Artist',
    description: '',
  });

  // Handle generic string list item removal
  const handleRemoveItem = (section: keyof Omit<PlatformTaxonomy, 'categories'>, index: number) => {
    setTaxonomy((prev) => {
      const list = [...(prev[section] as string[])];
      list.splice(index, 1);
      return { ...prev, [section]: list };
    });
  };

  // Handle generic string list item addition
  const handleAddItem = (section: keyof Omit<PlatformTaxonomy, 'categories'>) => {
    const val = newItemText.trim();
    if (!val) return;

    setTaxonomy((prev) => {
      const current = prev[section] as string[];
      if (current.includes(val)) {
        showError(`"${val}" already exists in ${section}`);
        return prev;
      }
      return { ...prev, [section]: [...current, val] };
    });

    setNewItemText('');
  };

  // Handle category removal
  const handleRemoveCategory = (catId: string) => {
    if (taxonomy.categories.length <= 1) {
      showError('At least one artist category must remain active.');
      return;
    }
    setTaxonomy((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== catId),
    }));
  };

  // Handle adding new category
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.label?.trim()) {
      showError('Please enter a category title.');
      return;
    }

    const generatedId =
      newCat.id?.trim() ||
      newCat.label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    if (taxonomy.categories.some((c) => c.id === generatedId)) {
      showError(`A category with ID "${generatedId}" already exists.`);
      return;
    }

    const created: ArtistCategory = {
      id: generatedId,
      label: newCat.label.trim(),
      shortLabel: newCat.shortLabel?.trim() || newCat.label.trim(),
      hindiName: newCat.hindiName?.trim() || newCat.label.trim(),
      emoji: newCat.emoji?.trim() || '🎭',
      badge: newCat.badge?.trim() || `Verified ${newCat.label.trim()}`,
      description: newCat.description?.trim() || `Professional ${newCat.label.trim()} performers and artists.`,
      popularEventTypes: ['Wedding', 'Corporate Event', 'Private Party'],
      specialties: ['Crowd Engagement', 'Live Performance'],
      mediaTypes: ['video', 'photo'],
    };

    setTaxonomy((prev) => ({
      ...prev,
      categories: [...prev.categories, created],
    }));

    setNewCat({
      id: '',
      label: '',
      shortLabel: '',
      hindiName: '',
      emoji: '🎭',
      badge: 'Verified Artist',
      description: '',
    });
    setShowAddCategory(false);
    success(`Category "${created.label}" added to draft! Click "Save Changes to Database" to apply.`);
  };

  // Save all changes
  const handleSaveAll = () => {
    startTransition(async () => {
      const res = await savePlatformTaxonomy(taxonomy);
      if (res.success) {
        success('👑 All taxonomy options and profile dropdowns saved & synchronized with database!');
      } else {
        showError(res.error || 'Failed to save taxonomy settings');
      }
    });
  };

  // Reset current section to default
  const handleResetSection = async (section: TabKey) => {
    if (!confirm(`Are you sure you want to reset "${section}" back to canonical platform defaults?`)) {
      return;
    }

    startTransition(async () => {
      const res = await resetTaxonomyToDefault(section);
      if (res.success) {
        success(`"${section}" reset to platform defaults. Reloading...`);
        window.location.reload();
      } else {
        showError(res.error || 'Failed to reset');
      }
    });
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3>
            <Layers size={20} color="var(--color-primary, #6c5ce7)" />
            Profile Dropdowns & Taxonomy Options Manager
          </h3>
          <p className={styles.subtitle}>
            Control and customize every option, craft, language, occasion, city, and badge displayed in
            Artist Profile Editors, Packages, and Client Inquiry forms. Changes instantly sync to the database!
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSaveAll}
          disabled={isPending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {isPending ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          Save Changes to Database
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsBar}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = Array.isArray(taxonomy[tab.key]) ? (taxonomy[tab.key] as any[]).length : 0;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
              onClick={() => {
                setActiveTab(tab.key);
                setNewItemText('');
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span className={styles.countBadge}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Artist Categories */}
      {activeTab === 'categories' && (
        <div>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionDesc}>
              These crafts appear in the <strong>Artist Category & Profession</strong> dropdown in the Profile Editor,
              influencing verified badges, filter tags, and talent directory classification.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddCategory((p) => !p)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> {showAddCategory ? 'Cancel' : 'Add New Category'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleResetSection('categories')}
                disabled={isPending}
                title="Reset to default categories"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}
              >
                <RotateCcw size={12} /> Reset Defaults
              </button>
            </div>
          </div>

          {/* Add Category Form Modal / Collapsible */}
          {showAddCategory && (
            <form
              onSubmit={handleAddCategorySubmit}
              style={{
                background: 'rgba(108, 92, 231, 0.08)',
                border: '1px solid rgba(108, 92, 231, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px' }}>Label (Display Name) *</label>
                <input
                  required
                  className="input input-sm"
                  placeholder="e.g. Dhol Ensemble & Percussionists"
                  value={newCat.label}
                  onChange={(e) => setNewCat({ ...newCat, label: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px' }}>Short Label</label>
                <input
                  className="input input-sm"
                  placeholder="e.g. Dhol Player"
                  value={newCat.shortLabel}
                  onChange={(e) => setNewCat({ ...newCat, shortLabel: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px' }}>Hindi Translation</label>
                <input
                  className="input input-sm"
                  placeholder="e.g. ढोल वादक"
                  value={newCat.hindiName}
                  onChange={(e) => setNewCat({ ...newCat, hindiName: e.target.value })}
                />
              </div>

              <div className="input-group" style={{ maxWidth: '100px' }}>
                <label className="input-label" style={{ fontSize: '12px' }}>Emoji</label>
                <input
                  className="input input-sm"
                  placeholder="🥁"
                  value={newCat.emoji}
                  onChange={(e) => setNewCat({ ...newCat, emoji: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px' }}>Verified Badge</label>
                <input
                  className="input input-sm"
                  placeholder="e.g. Verified Dhol Artist"
                  value={newCat.badge}
                  onChange={(e) => setNewCat({ ...newCat, badge: e.target.value })}
                />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label" style={{ fontSize: '12px' }}>Description</label>
                <input
                  className="input input-sm"
                  placeholder="e.g. High-energy Punjabi dhol players, wedding baraat rhythmists, and percussion troupes."
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowAddCategory(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Add Category to List
                </button>
              </div>
            </form>
          )}

          {/* Category Cards List */}
          <div className={styles.categoryGrid}>
            {taxonomy.categories.map((cat) => (
              <div key={cat.id} className={styles.categoryCard}>
                <div className={styles.categoryTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={styles.categoryEmoji}>{cat.emoji || '🎭'}</span>
                    <div>
                      <h4 className={styles.categoryTitle}>{cat.label}</h4>
                      <span className={styles.categoryHindi}>{cat.hindiName || cat.shortLabel}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveCategory(cat.id)}
                    title={`Remove ${cat.label}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={styles.categoryBadge}>{cat.badge || 'Verified'}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>ID: {cat.id}</span>
                </div>

                <p className={styles.categoryDesc}>{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Generic String List Tabs (Event Types, Languages, Cities, Specialties, Brands, Budget) */}
      {activeTab !== 'categories' && (
        <div>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionDesc}>
              {activeTab === 'eventTypes' &&
                'Options displayed in Profile "Event Types You Cover", Packages Manager, and Client Public Inquiry form.'}
              {activeTab === 'languages' &&
                'Languages shown in Profile "Languages You Host In" multiselect chip section.'}
              {activeTab === 'cities' &&
                'Cities available in Base Location auto-complete datalist and Tour Routing suggestions.'}
              {activeTab === 'specialties' &&
                'Signature skills & craft superpowers available as 1-click presets for artists.'}
              {activeTab === 'clientBrands' &&
                'Prestige & luxury corporate brands available as quick chips for the profile marquee.'}
              {activeTab === 'budgetRanges' &&
                'Budget brackets available in Client Inquiry booking forms on public profiles.'}
            </p>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleResetSection(activeTab)}
              disabled={isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}
            >
              <RotateCcw size={12} /> Reset to Defaults
            </button>
          </div>

          {/* Quick Add Bar */}
          <div className={styles.addBar}>
            <input
              type="text"
              className="input input-sm"
              placeholder={`Type new ${TABS.find((t) => t.key === activeTab)?.label.slice(0, -1) || 'item'} and press Enter...`}
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem(activeTab as any);
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleAddItem(activeTab as any)}
              disabled={!newItemText.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          {/* Chips Grid */}
          <div className={styles.chipGrid}>
            {(taxonomy[activeTab] as string[]).map((item, idx) => (
              <span key={`${item}-${idx}`} className={styles.chipItem}>
                <span>{item}</span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleRemoveItem(activeTab as any, idx)}
                  title={`Remove ${item}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.actionsFooter}>
        <button
          className="btn btn-primary"
          onClick={handleSaveAll}
          disabled={isPending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {isPending ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          Save Changes to Database
        </button>
      </div>
    </div>
  );
}
