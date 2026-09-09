'use client';

import { useState } from 'react';
import {
  MessageSquareQuote,
  Star,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { addTestimonial, updateTestimonial, deleteTestimonial } from '@/lib/actions/testimonials';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatEventDate } from '@/lib/utils';
import type { Testimonial } from '@/types';
import styles from '@/app/(dashboard)/portfolio/portfolio.module.css';

interface TestimonialsManagerProps {
  initialTestimonials: Testimonial[];
}

export function TestimonialsManager({ initialTestimonials }: TestimonialsManagerProps) {
  const { success, error: showError } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Testimonial | null>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientDesignation, setClientDesignation] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState('');

  const handleOpenModal = () => {
    setClientName('');
    setClientDesignation('');
    setText('');
    setRating(5);
    setEventType('Wedding');
    setEventDate('');
    setIsModalOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !text.trim()) {
      showError('Please fill in both client name and review text');
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await addTestimonial({
        client_name: clientName,
        client_designation: clientDesignation,
        text,
        rating,
        event_type: eventType,
        event_date: eventDate || null,
      });

      setTestimonials((prev) => [added, ...prev]);
      success('Review added successfully! Now visible on your portfolio.');
      setIsModalOpen(false);
    } catch (err: any) {
      showError(err?.message || 'Failed to add review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVisibility = async (t: Testimonial) => {
    const nextState = !t.is_visible;
    try {
      await updateTestimonial(t.id, { is_visible: nextState });
      setTestimonials((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, is_visible: nextState } : item))
      );
      success(nextState ? 'Review is now live on your portfolio' : 'Review hidden from portfolio');
    } catch (err: any) {
      showError('Failed to update visibility');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteTestimonial(deletingItem.id);
      setTestimonials((prev) => prev.filter((item) => item.id !== deletingItem.id));
      success('Review deleted');
      setDeletingItem(null);
    } catch (err: any) {
      showError('Failed to delete review');
    }
  };

  return (
    <div className={styles.formSection} style={{ border: '1px solid rgba(108, 92, 231, 0.3)' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
            <MessageSquareQuote size={20} color="var(--color-primary)" /> Client Reviews & Testimonials
          </h3>
          <p className="text-xs text-secondary" style={{ marginTop: '4px' }}>
            Display high-impact reviews from past wedding couples, corporate organizers, and event agencies to build trust and close more bookings!
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenModal}
          style={{ gap: '6px' }}
        >
          <Plus size={16} /> Add Client Review
        </button>
      </div>

      {/* Testimonials List / Empty State */}
      {testimonials.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 16px', background: 'transparent' }}>
          <MessageSquareQuote size={36} color="var(--color-text-tertiary)" />
          <div className="empty-state-title" style={{ fontSize: '15px', marginTop: '10px' }}>
            No Client Reviews Added Yet
          </div>
          <p className="text-xs text-tertiary" style={{ maxWidth: '380px', margin: '4px auto 14px' }}>
            Event organizers and wedding couples book anchors who have credible social proof. Add your first couple or corporate review now!
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleOpenModal}>
            <Plus size={14} /> Add First Review
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {testimonials.map((t) => (
            <div
              key={t.id}
              style={{
                borderRadius: '12px',
                padding: '16px',
                background: 'var(--color-bg-secondary)',
                border: t.is_visible ? '1px solid var(--color-border)' : '1px dashed rgba(255, 255, 255, 0.1)',
                opacity: t.is_visible ? 1 : 0.65,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                position: 'relative',
              }}
            >
              {/* Top Row: Stars + Event Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < t.rating ? '#F59E0B' : 'transparent'}
                      color={i < t.rating ? '#F59E0B' : '#4B5563'}
                    />
                  ))}
                </div>

                <span className="badge badge-accent" style={{ fontSize: '11px' }}>
                  {t.event_type || 'Event'}
                </span>
              </div>

              {/* Review Text */}
              <p
                style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: 'var(--color-text-primary)',
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author Info & Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {t.client_name}
                  </div>
                  {t.client_designation && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      {t.client_designation}
                    </div>
                  )}
                  {t.event_date && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                      📅 {formatEventDate(t.event_date)}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(t)}
                    className="btn btn-ghost btn-xs"
                    title={t.is_visible ? 'Hide from portfolio' : 'Show on portfolio'}
                  >
                    {t.is_visible ? <Eye size={14} color="#10B981" /> : <EyeOff size={14} color="#6B7280" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingItem(t)}
                    className="btn btn-ghost btn-xs"
                    style={{ color: '#EF4444' }}
                    title="Delete review"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 11, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Add Client Testimonial</h4>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Client Name & Designation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">
                    Client / Couple Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Pooja & Kunal"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Title / Relation</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Bride & Groom"
                    value={clientDesignation}
                    onChange={(e) => setClientDesignation(e.target.value)}
                  />
                </div>
              </div>

              {/* Event Type & Rating */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Event Type</label>
                  <select
                    className="input"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Sangeet">Sangeet / Mehendi</option>
                    <option value="Corporate">Corporate Conference / Gala</option>
                    <option value="College Fest">College Fest</option>
                    <option value="Reception">Reception</option>
                    <option value="Birthday / Anniversary">Birthday / Anniversary</option>
                    <option value="Award Show">Award Show</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Star Rating</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      >
                        <Star
                          size={22}
                          fill={s <= rating ? '#F59E0B' : 'transparent'}
                          color={s <= rating ? '#F59E0B' : '#4B5563'}
                        />
                      </button>
                    ))}
                    <span style={{ fontSize: '13px', fontWeight: 600, marginLeft: '6px', color: '#F59E0B' }}>
                      {rating} / 5
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Date */}
              <div className="input-group">
                <label className="input-label">Event Date (Optional)</label>
                <input
                  type="date"
                  className="input"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>

              {/* Review Text */}
              <div className="input-group">
                <label className="input-label">
                  Client Review / Words of Praise <span className="required">*</span>
                </label>
                <textarea
                  className="input textarea"
                  rows={4}
                  placeholder="e.g. Rahul was simply outstanding at our Udaipur wedding! His crowd energy was unmatched and our guests are still talking about his hosting..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ gap: '6px' }}
                >
                  {isSubmitting ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                  {isSubmitting ? 'Adding...' : 'Save & Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingItem}
        title="Delete Testimonial"
        description={`Are you sure you want to delete the review by "${deletingItem?.client_name}"? This action cannot be undone.`}
        confirmText="Delete Review"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
}
