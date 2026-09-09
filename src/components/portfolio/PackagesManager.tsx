'use client';

import { useState } from 'react';
import {
  Heart,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { addPackage, updatePackage, deletePackage } from '@/lib/actions/packages';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatINR } from '@/lib/utils';
import { EVENT_TYPES } from '@/constants';
import type { ServicePackage } from '@/types';
import styles from '@/app/(dashboard)/portfolio/portfolio.module.css';

interface PackagesManagerProps {
  initialPackages: ServicePackage[];
}

export function PackagesManager({ initialPackages }: PackagesManagerProps) {
  const { success, error: showError } = useToast();
  const [packages, setPackages] = useState<ServicePackage[]>(initialPackages);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<ServicePackage | null>(null);
  const [deletingItem, setDeletingItem] = useState<ServicePackage | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setEventType('Wedding');
    setPriceMin('');
    setPriceMax('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: ServicePackage) => {
    setEditingItem(pkg);
    setName(pkg.name);
    setDescription(pkg.description);
    setEventType(pkg.event_type || 'Wedding');
    setPriceMin(pkg.price_range_min ? pkg.price_range_min.toString() : '');
    setPriceMax(pkg.price_range_max ? pkg.price_range_max.toString() : '');
    setIsActive(pkg.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError('Please provide a package title');
      return;
    }

    setIsSubmitting(true);
    try {
      const minVal = priceMin.trim() ? parseInt(priceMin, 10) : null;
      const maxVal = priceMax.trim() ? parseInt(priceMax, 10) : null;

      if (editingItem) {
        const updated = await updatePackage(editingItem.id, {
          name: name.trim(),
          description: description.trim(),
          event_type: eventType,
          price_range_min: minVal,
          price_range_max: maxVal,
          is_active: isActive,
        });

        setPackages(prev => prev.map(p => (p.id === editingItem.id ? updated : p)));
        success(`Package "${name}" updated successfully!`);
      } else {
        const added = await addPackage({
          name: name.trim(),
          description: description.trim(),
          event_type: eventType,
          price_range_min: minVal,
          price_range_max: maxVal,
        });

        setPackages(prev => [added, ...prev]);
        success(`Package "${name}" added to your portfolio!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showError(err?.message || 'Failed to save package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (pkg: ServicePackage) => {
    const nextState = !pkg.is_active;
    try {
      await updatePackage(pkg.id, { is_active: nextState });
      setPackages(prev => prev.map(p => (p.id === pkg.id ? { ...p, is_active: nextState } : p)));
      success(nextState ? `"${pkg.name}" is now live on your portfolio` : `"${pkg.name}" hidden from public portfolio`);
    } catch {
      showError('Failed to update package visibility');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deletePackage(deletingItem.id);
      setPackages(prev => prev.filter(p => p.id !== deletingItem.id));
      success(`Package "${deletingItem.name}" deleted`);
      setDeletingItem(null);
    } catch {
      showError('Failed to delete package');
    }
  };

  return (
    <div className={styles.formSection}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
            <Heart size={18} color="var(--color-accent)" /> Event Packages & Pricing
          </h3>
          <span className="badge badge-primary" style={{ fontSize: '11px' }}>
            {packages.filter(p => p.is_active).length} Packages Live
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenAddModal}
          style={{ gap: '6px' }}
        >
          <Plus size={14} /> Add Event Package
        </button>
      </div>

      <p className="text-sm text-secondary" style={{ margin: '0 0 16px 0', maxWidth: '720px' }}>
        Create transparent event packages for sangeets, weddings, and corporate summits. Clients can view pricing ranges and submit booking inquiries directly for these offerings.
      </p>

      {/* Packages Grid */}
      {packages.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 16px', background: 'transparent' }}>
          <Heart size={36} color="var(--color-accent)" style={{ opacity: 0.8 }} />
          <div className="empty-state-title" style={{ fontSize: '16px', marginTop: '10px' }}>
            No Event Packages Created Yet
          </div>
          <p className="text-xs text-tertiary" style={{ maxWidth: '400px', margin: '4px auto 16px' }}>
            Packages with transparent pricing build high client trust and increase corporate & wedding bookings by up to 3x!
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleOpenAddModal}
            style={{ gap: '6px' }}
          >
            <Plus size={14} /> Add Your First Package
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {packages.map(pkg => (
            <div
              key={pkg.id}
              style={{
                borderRadius: '14px',
                background: 'var(--color-bg-secondary)',
                border: pkg.is_active ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid var(--color-border)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                opacity: pkg.is_active ? 1 : 0.65,
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <span
                    className="badge"
                    style={{
                      fontSize: '10px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: 'var(--color-primary)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    {pkg.event_type || 'General'}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '10px',
                      background: pkg.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      color: pkg.is_active ? '#10B981' : 'var(--color-text-tertiary)',
                      border: 'none',
                    }}
                  >
                    {pkg.is_active ? 'Live on Profile' : 'Hidden'}
                  </span>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                  {pkg.name}
                </h4>

                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5, minHeight: '36px' }}>
                  {pkg.description || 'No description provided.'}
                </p>

                {(pkg.price_range_min || pkg.price_range_max) && (
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38BDF8', marginBottom: '6px' }}>
                    {pkg.price_range_min && pkg.price_range_max
                      ? `${formatINR(pkg.price_range_min)} – ${formatINR(pkg.price_range_max)}`
                      : pkg.price_range_min
                      ? `From ${formatINR(pkg.price_range_min)}`
                      : `Up to ${formatINR(pkg.price_range_max!)}`}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleToggleActive(pkg)}
                  style={{ gap: '4px', color: pkg.is_active ? 'var(--color-text-secondary)' : '#10B981' }}
                  title={pkg.is_active ? 'Hide from public profile' : 'Make live on public profile'}
                >
                  {pkg.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{pkg.is_active ? 'Hide' : 'Show'}</span>
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleOpenEditModal(pkg)}
                    title="Edit Package"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{ color: 'var(--color-error)' }}
                    onClick={() => setDeletingItem(pkg)}
                    title="Delete Package"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Package Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '95%',
              background: 'var(--color-bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={18} color="var(--color-accent)" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                  {editingItem ? 'Edit Event Package' : 'Create New Event Package'}
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Package Name / Title *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Royal Destination Wedding (Full 2 Days)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Event Type</label>
                    <select
                      className="input"
                      value={eventType}
                      onChange={e => setEventType(e.target.value)}
                    >
                      {EVENT_TYPES.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="Corporate Summit">Corporate Summit</option>
                      <option value="Destination Wedding">Destination Wedding</option>
                      <option value="Private Gala">Private Gala</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Active Status</label>
                    <select
                      className="input"
                      value={isActive ? 'true' : 'false'}
                      onChange={e => setIsActive(e.target.value === 'true')}
                    >
                      <option value="true">Live on Portfolio</option>
                      <option value="false">Hidden / Draft</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Price Min (₹)</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="e.g. 50000"
                      value={priceMin}
                      onChange={e => setPriceMin(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Price Max (₹)</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="e.g. 75000"
                      value={priceMax}
                      onChange={e => setPriceMax(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Package Inclusions & Description *</label>
                  <textarea
                    className="input textarea"
                    required
                    rows={3}
                    placeholder="e.g. Complete 2-day hosting for Mehendi, Sangeet, and Grand Reception. Includes couple roasts, DJ handoff, and pre-wedding rehearsal coordination."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> {editingItem ? 'Save Changes' : 'Create Package'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title={`Delete "${deletingItem?.name}"?`}
        description="Are you sure you want to remove this package? It will no longer appear on your public portfolio."
        confirmText="Delete Package"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
