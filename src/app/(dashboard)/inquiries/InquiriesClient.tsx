'use client';

import { useState, useTransition, useRef } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Search,
  Eye,
  MessageCircle,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  UserPlus,
  Loader2,
  Tag,
  Share2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { INQUIRY_STATUS, INQUIRY_STATUS_COLORS, EVENT_TYPES, BUDGET_RANGES, MAJOR_CITIES } from '@/constants';
import { formatRelativeTime, cn, formatEventDate } from '@/lib/utils';
import { updateInquiryStatus, createManualInquiry, deleteInquiry } from '@/lib/actions/inquiries';
import type { Inquiry, InquiryStatus } from '@/types';
import type { BookingRecord } from '@/lib/actions/schedule';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EventFunctionsPicker } from '@/components/common/EventFunctionsPicker';
import styles from './inquiries.module.css';

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  converted: 'Converted',
  lost: 'Lost',
};

const SOURCE_LABELS: Record<string, string> = {
  direct: '📱 Phone / Direct',
  referral: '🤝 Referral',
  portfolio: '🌐 Website',
  directory: '📋 Directory',
};

interface InquiriesClientProps {
  initialInquiries: Inquiry[];
  initialBookings?: BookingRecord[];
  profileName?: string;
}

export function InquiriesClient({ initialInquiries, initialBookings = [], profileName = 'Artist' }: InquiriesClientProps) {
  const { success, error: showError } = useToast();
  const [isPending, startTransition] = useTransition();
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [filter, setFilter] = useState<InquiryStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialInquiries[0]?.id || null);
  const [pendingStatus, setPendingStatus] = useState<InquiryStatus | ''>('');
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'detail'>('list');
  const detailRef = useRef<HTMLDivElement>(null);

  // Helper to detect if a booking is tentative/pencil hold
  const isBookingTentative = (b?: BookingRecord | null) => {
    if (!b) return false;
    return (
      (b as any).booking_status === 'tentative' ||
      b.notes?.includes('[PENCIL_HOLD]') === true
    );
  };

  // Clash detector for an inquiry date against existing bookings
  const getBookingClash = (eventDate?: string | null) => {
    if (!eventDate || !initialBookings || initialBookings.length === 0) return null;
    const match = initialBookings.find((b) => b.date === eventDate && b.event_type !== 'Travel');
    if (!match) return null;
    const isTentative = isBookingTentative(match);
    return {
      booking: match,
      isTentative,
      type: isTentative ? ('hold' as const) : ('confirmed' as const),
    };
  };

  // Dual inquiry check on the same date
  const getDualInquiries = (eventDate?: string | null, currentId?: string | null) => {
    if (!eventDate) return [];
    return inquiries.filter((i) => i.event_date === eventDate && i.id !== currentId);
  };

  // Manual Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    event_type: 'Wedding',
    event_date: '',
    event_city: '',
    budget_range: '',
    message: '',
    notes: '',
    status: 'new' as InquiryStatus,
    source: 'direct' as 'direct' | 'referral',
    lead_channel: 'Phone Call', // Phone Call, WhatsApp, Instagram DM, Referral, Event Agency
  });

  // Notes editing state for selected lead
  const [activeNotes, setActiveNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Delete lead state
  const [deletingInquiry, setDeletingInquiry] = useState<Inquiry | null>(null);

  const filtered = inquiries
    .filter((i) => filter === 'all' || i.status === filter)
    .filter(
      (i) =>
        !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.event_type || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.event_city || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.phone || '').includes(search)
    );

  const selected = inquiries.find((i) => i.id === selectedId);

  const handleStatusUpdate = () => {
    if (!selectedId || !pendingStatus) return;
    startTransition(async () => {
      try {
        await updateInquiryStatus(selectedId, pendingStatus as InquiryStatus);
        setInquiries((prev) =>
          prev.map((i) => (i.id === selectedId ? { ...i, status: pendingStatus as InquiryStatus } : i))
        );
        success('Lead status updated!');
      } catch (err) {
        showError('Failed to update status');
      }
    });
  };

  const handleSaveNotes = () => {
    if (!selectedId) return;
    startTransition(async () => {
      try {
        await updateInquiryStatus(selectedId, selected?.status || 'new', activeNotes);
        setInquiries((prev) =>
          prev.map((i) => (i.id === selectedId ? { ...i, notes: activeNotes } : i))
        );
        setIsEditingNotes(false);
        success('CRM notes updated!');
      } catch (err) {
        showError('Failed to save notes');
      }
    });
  };

  const handleCreateLead = async (openWhatsAppAfter = false) => {
    if (!newLead.name.trim() || !newLead.phone.trim()) {
      showError('Please enter client name and phone number');
      return;
    }

    startTransition(async () => {
      try {
        const fullNotes = [
          newLead.lead_channel ? `[Channel: ${newLead.lead_channel}]` : '',
          newLead.notes,
        ]
          .filter(Boolean)
          .join('\n');

        const created = await createManualInquiry({
          name: newLead.name.trim(),
          phone: newLead.phone.trim(),
          email: newLead.email.trim(),
          event_type: newLead.event_type,
          event_date: newLead.event_date || undefined,
          event_city: newLead.event_city.trim(),
          budget_range: newLead.budget_range,
          message: newLead.message.trim(),
          notes: fullNotes,
          status: newLead.status,
          source: newLead.source,
        });

        setInquiries((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setShowAddModal(false);
        success('Personal lead added to CRM!');

        if (openWhatsAppAfter) {
          const p = (newLead.phone || '').replace(/\D/g, '');
          const cleanPhone = p.startsWith('91') ? p : `91${p}`;
          const text = `Hi ${newLead.name}! It was great speaking with you regarding your upcoming ${newLead.event_type || 'event'}${newLead.event_date ? ` on ${newLead.event_date}` : ''}. I've logged your request in my schedule. Let's stay connected!`;
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        }

        // Reset form
        setNewLead({
          name: '',
          phone: '',
          email: '',
          event_type: 'Wedding',
          event_date: '',
          event_city: '',
          budget_range: '',
          message: '',
          notes: '',
          status: 'new',
          source: 'direct',
          lead_channel: 'Phone Call',
        });
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to add lead');
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingInquiry) return;
    const inq = deletingInquiry;

    startTransition(async () => {
      try {
        await deleteInquiry(inq.id);
        setInquiries((prev) => prev.filter((i) => i.id !== inq.id));
        if (selectedId === inq.id) {
          setSelectedId(null);
        }
        setDeletingInquiry(null);
        success('Lead deleted from CRM');
      } catch (err) {
        showError('Failed to delete lead');
      }
    });
  };

  return (
    <div className="container" style={{ padding: 'var(--space-6) var(--space-4) 96px var(--space-4)', maxWidth: '1400px' }}>
      {/* Top Header */}
      <div className={cn(styles.pageHeader, mobileActiveView === 'detail' && styles.hideOnMobile)}>
        <div>
          <h1 className={styles.pageTitle}>Inquiries & Leads CRM</h1>
          <p className={styles.pageSubtitle}>
            Manage website inquiries, log direct phone calls, and track your client pipeline
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className={styles.headerStats}>
            <div className={styles.headerStat}>
              <span className={styles.headerStatValue}>
                {inquiries.filter((i) => i.status === 'new').length}
              </span>
              <span className={styles.headerStatLabel}>New</span>
            </div>
            <div className={styles.headerStat}>
              <span className={styles.headerStatValue}>
                {inquiries.filter((i) => i.status === 'contacted').length}
              </span>
              <span className={styles.headerStatLabel}>In Discussion</span>
            </div>
            <div className={styles.headerStat}>
              <span className={styles.headerStatValue}>
                {inquiries.filter((i) => i.status === 'converted').length}
              </span>
              <span className={styles.headerStatLabel}>Converted</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ gap: '8px' }}
          >
            <Plus size={16} /> Add Personal Lead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={cn(styles.filters, mobileActiveView === 'detail' && styles.hideOnMobile)}>
        <div className={styles.searchBox}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            className="input"
            placeholder="Search name, phone, city, event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div className={styles.filterTabs}>
          <button
            className={cn(styles.filterTab, filter === 'all' && styles.filterTabActive)}
            onClick={() => setFilter('all')}
          >
            All ({inquiries.length})
          </button>
          {(['new', 'contacted', 'converted', 'lost'] as InquiryStatus[]).map((status) => {
            const count = inquiries.filter((i) => i.status === status).length;
            return (
              <button
                key={status}
                className={cn(styles.filterTab, filter === status && styles.filterTabActive)}
                onClick={() => setFilter(status)}
              >
                {STATUS_LABELS[status]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main CRM Layout */}
      <div className={styles.layout}>
        {/* Left Side: Leads List */}
        <div className={cn(styles.inquiryList, mobileActiveView === 'detail' && styles.hideOnMobile)}>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon">
                <MessageSquare size={24} />
              </div>
              <div className="empty-state-title">No leads found</div>
              <div className="empty-state-text" style={{ fontSize: '12px', marginTop: '4px' }}>
                {filter === 'all' && !search
                  ? 'Click "+ Add Personal Lead" to log a client phone call or inquiry'
                  : 'Try changing your search or filter'}
              </div>
            </div>
          ) : (
            filtered.map((inq) => (
              <button
                key={inq.id}
                className={cn(styles.inquiryCard, selectedId === inq.id && styles.inquiryCardActive)}
                onClick={() => {
                  setSelectedId(inq.id);
                  setPendingStatus(inq.status);
                  setActiveNotes(inq.notes || '');
                  setIsEditingNotes(false);
                  setMobileActiveView('detail');
                }}
              >
                <div className={styles.inquiryCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={styles.inquiryName}>{inq.name}</span>
                    {selectedId === inq.id && (
                      <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 700 }}>
                        ● Active
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {SOURCE_LABELS[inq.source] || 'Direct'}
                    </span>
                    <span className={`badge badge-${INQUIRY_STATUS_COLORS[inq.status]}`} style={{ fontSize: '11px' }}>
                      {STATUS_LABELS[inq.status]}
                    </span>
                  </div>
                </div>

                <p className={styles.inquiryPreview}>
                  {inq.message || inq.notes || 'No message provided'}
                </p>

                {(() => {
                  const clash = getBookingClash(inq.event_date);
                  const duals = getDualInquiries(inq.event_date, inq.id);
                  if (clash?.type === 'confirmed') {
                    return (
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#F87171',
                        background: 'rgba(239, 68, 68, 0.15)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        ⚔️ Booked Clash ({formatEventDate(inq.event_date)})
                      </div>
                    );
                  }
                  if (clash?.type === 'hold') {
                    return (
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#FBBF24',
                        background: 'rgba(245, 158, 11, 0.2)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        ⚡ Hold Clash (Nudge Opportunity)
                      </div>
                    );
                  }
                  if (duals.length > 0) {
                    return (
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#C084FC',
                        background: 'rgba(192, 132, 252, 0.15)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        🔥 {duals.length + 1} Inquiries on this Date
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className={styles.inquiryMeta} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {inq.event_type && (
                      <span>
                        <Calendar size={12} /> {inq.event_type}
                      </span>
                    )}
                    {inq.event_city && (
                      <span>
                        <MapPin size={12} /> {inq.event_city}
                      </span>
                    )}
                    <span>{formatRelativeTime(inq.created_at)}</span>
                  </div>

                  {inq.phone && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        const p = (inq.phone || '').replace(/\D/g, '');
                        const phone = p.startsWith('91') ? p : `91${p}`;
                        const msg = `Hi ${inq.name}! This is regarding your booking inquiry on StageHost for ${inq.event_type || 'an event'}${inq.event_date ? ` on ${inq.event_date}` : ''}${inq.event_city ? ` in ${inq.event_city}` : ''}. I would love to host your event! Can we discuss details?`;
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      style={{
                        background: 'rgba(37, 211, 102, 0.15)',
                        color: '#25D366',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="1-Tap WhatsApp Reply"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right Side: Detail & Action Pane */}
        <div className={cn(styles.inquiryDetail, mobileActiveView === 'list' && styles.hideOnMobile)} ref={detailRef}>
          {selected ? (
            <>
              {/* Mobile Back Button */}
              <button
                type="button"
                className={styles.mobileBackBtn}
                onClick={() => setMobileActiveView('list')}
              >
                <ArrowLeft size={15} /> Back to Leads List
              </button>

              {/* Detail Header */}
              <div className={styles.detailHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{selected.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span className={`badge badge-${INQUIRY_STATUS_COLORS[selected.status]}`}>
                      {STATUS_LABELS[selected.status]}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      Source: {SOURCE_LABELS[selected.source] || 'Direct Lead'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--color-error)' }}
                  onClick={() => setDeletingInquiry(selected)}
                  title="Delete lead"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Dual-Inquiry & Clash Intelligence Alert */}
              {(() => {
                const selectedClash = getBookingClash(selected.event_date);
                const duals = getDualInquiries(selected.event_date, selected.id);

                if (!selectedClash && duals.length === 0) return null;

                const eventDateFormatted = selected.event_date ? formatEventDate(selected.event_date) : '';

                if (selectedClash?.type === 'hold') {
                  const holdBooking = selectedClash.booking;
                  const holdClient = holdBooking.client_name || 'Client on Hold';
                  const holdPhone = holdBooking.client_phone?.replace(/\D/g, '') || '';
                  const nudgeMsg = `Hi ${holdClient}! 🌟

We just received another high-intent inquiry for *${eventDateFormatted}* from a party looking to lock this date immediately.

As promised, offering you first right of refusal before releasing the hold. Can we lock your confirmation with the advance token today?

Looking forward to hosting your celebration!
— ${profileName}`;

                  const priorityReplyMsg = `Hi ${selected.name}! 🌟

Thanks for reaching out regarding *${eventDateFormatted}*. We currently have a 24-48h tentative pencil hold on this date.

If you are ready to confirm with an advance token today, please let us know so we can give you priority if the slot becomes available!

Warm regards,
${profileName}`;

                  return (
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.05))',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px' }}>⚡</span>
                        <h4 style={{ margin: 0, fontSize: '14px', color: '#FBBF24', fontWeight: 700 }}>
                          High Opportunity: Date Clash with Active Pencil Hold!
                        </h4>
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        You have an existing Pencil Hold on <strong>{eventDateFormatted}</strong> for <strong>{holdClient}</strong> ({holdBooking.event_name || holdBooking.event_type}). Use this fresh inquiry from <strong>{selected.name}</strong> as leverage to convert your hold into a confirmed booking!
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {holdPhone && (
                          <a
                            href={`https://wa.me/${holdPhone.startsWith('91') ? holdPhone : `91${holdPhone}`}?text=${encodeURIComponent(nudgeMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                            style={{
                              background: '#F59E0B',
                              borderColor: '#F59E0B',
                              color: '#000',
                              fontWeight: 700,
                              fontSize: '11px',
                              padding: '6px 12px',
                              gap: '6px',
                            }}
                          >
                            <MessageCircle size={13} />
                            <span>Nudge {holdClient} (WhatsApp Leverage)</span>
                          </a>
                        )}
                        <a
                          href={`https://wa.me/${(() => {
                            const p = (selected.phone || '').replace(/\D/g, '');
                            return p.startsWith('91') ? p : `91${p}`;
                          })()}?text=${encodeURIComponent(priorityReplyMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{
                            fontSize: '11px',
                            padding: '6px 12px',
                            color: '#FCD34D',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                          }}
                        >
                          Reply Priority Notice to {selected.name}
                        </a>
                      </div>
                    </div>
                  );
                }

                if (selectedClash?.type === 'confirmed') {
                  const booked = selectedClash.booking;
                  return (
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.05))',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px' }}>🔒</span>
                        <h4 style={{ margin: 0, fontSize: '14px', color: '#F87171', fontWeight: 700 }}>
                          Date Booked Clash: Slot Already Locked
                        </h4>
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        You already have a confirmed show on <strong>{eventDateFormatted}</strong> ({booked.event_name || booked.event_type} in {booked.city || 'Venue'}). You cannot take this show unless you offer an alternate date or recommend a sister artist.
                      </p>
                      <a
                        href={`https://wa.me/${(() => {
                          const p = (selected.phone || '').replace(/\D/g, '');
                          return p.startsWith('91') ? p : `91${p}`;
                        })()}?text=${encodeURIComponent(`Hi ${selected.name}! Thank you for reaching out for ${eventDateFormatted}. My date is already booked with a confirmed show. Would you have an alternative date or would you like me to refer a trusted fellow anchor from my team?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '11px', padding: '6px 12px', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                      >
                        Offer Alternate Date on WhatsApp
                      </a>
                    </div>
                  );
                }

                if (duals.length > 0) {
                  return (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D8B4FE', fontSize: '13px', fontWeight: 600 }}>
                        <span>🔥</span>
                        <span>{duals.length + 1} Simultaneous Inquiries for {eventDateFormatted}!</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        Peak demand date! Also inquired by: {duals.map((d) => d.name).join(', ')}. Prioritize the client offering the highest budget or earliest token payment.
                      </p>
                    </div>
                  );
                }

                return null;
              })()}

              {/* 1-Click WhatsApp & Phone Actions */}
              <div
                className={styles.detailContact}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <a
                  href={`https://wa.me/${(() => {
                    const p = (selected.phone || '').replace(/\D/g, '');
                    return p.startsWith('91') ? p : `91${p}`;
                  })()}?text=${encodeURIComponent(
                    `Hi ${selected.name}! This is regarding your booking inquiry on StageHost for ${selected.event_type || 'an event'}${selected.event_date ? ` on ${selected.event_date}` : ''}${selected.event_city ? ` in ${selected.event_city}` : ''}. I would love to host your event! Can we discuss commercials and details?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#25D366', borderColor: '#25D366', color: '#fff', gap: '6px' }}
                >
                  <MessageCircle size={15} /> Reply on WhatsApp (1-Click)
                </a>

                <a href={`tel:+91${selected.phone}`} className={styles.contactItem}>
                  <Phone size={14} /> +91 {selected.phone}
                </a>

                {selected.email && (
                  <a href={`mailto:${selected.email}`} className={styles.contactItem}>
                    <Mail size={14} /> {selected.email}
                  </a>
                )}
              </div>

              {/* Event Details Grid */}
              <div className={styles.detailSection}>
                <h4>Event & Commercial Details</h4>
                <div className={styles.detailGrid}>
                  <div>
                    <span className="text-xs text-tertiary">Event Type</span>
                    <p>{selected.event_type || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-tertiary">City / Destination</span>
                    <p>{selected.event_city || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-tertiary">Event Date</span>
                    <p>{selected.event_date ? formatEventDate(selected.event_date) : 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-tertiary">Budget / Expected Fee</span>
                    <p>{selected.budget_range || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Client Message / Requirements */}
              {selected.message && (
                <div className={styles.detailSection}>
                  <h4>Client Requirements</h4>
                  <p className={styles.detailMessage}>{selected.message}</p>
                </div>
              )}

              {/* CRM Internal Notes */}
              <div className={styles.detailSection}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0 }}>Host CRM Notes</h4>
                  {!isEditingNotes && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => {
                        setActiveNotes(selected.notes || '');
                        setIsEditingNotes(true);
                      }}
                    >
                      {selected.notes ? 'Edit Notes' : '+ Add Note'}
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      className="input textarea"
                      rows={3}
                      value={activeNotes}
                      onChange={(e) => setActiveNotes(e.target.value)}
                      placeholder="e.g. Quoted ₹45k. Client wants showreel. Follow up on Tuesday."
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={handleSaveNotes}
                        disabled={isPending}
                      >
                        Save Notes
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setIsEditingNotes(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.detailMessage} style={{ fontStyle: selected.notes ? 'normal' : 'italic', color: selected.notes ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                    {selected.notes || 'No notes added yet. Click "+ Add Note" to log discussion updates.'}
                  </p>
                )}
              </div>

              {/* Pipeline Status Action */}
              <div className={styles.detailActions}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    Pipeline Status:
                  </span>
                  <select
                    className="input"
                    value={pendingStatus || selected.status}
                    onChange={(e) => setPendingStatus(e.target.value as InquiryStatus)}
                    style={{ maxWidth: '200px' }}
                  >
                    {(['new', 'contacted', 'converted', 'lost'] as InquiryStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleStatusUpdate}
                  disabled={isPending || !pendingStatus || pendingStatus === selected.status}
                >
                  {isPending ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-12)' }}>
              <div className="empty-state-icon">
                <Eye size={28} />
              </div>
              <div className="empty-state-title">Select an Inquiry</div>
              <div className="empty-state-text">Click on any inquiry from the list to view client details</div>
            </div>
          )}
        </div>
      </div>

      {/* =======================================================
          MODAL: ADD PERSONAL LEAD / DIRECT PHONE INQUIRY
          ======================================================= */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 9, 15, 0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 180ms ease-out',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(108, 92, 231, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
                <UserPlus size={18} color="var(--color-primary)" />
                <span>Add Personal Client / Phone Lead</span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Log inquiries received over phone calls, WhatsApp messages, Instagram DMs, or event referrals to manage your entire booking pipeline in one place.
              </p>

              {/* Row 1: Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Client / Event Planner Name *</label>
                  <input
                    className="input"
                    required
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="e.g. Vikram Kapoor"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Phone Number *</label>
                  <input
                    className="input"
                    required
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="e.g. 9820012345"
                  />
                </div>
              </div>

              {/* Event Functions (Multi-Select & Custom) */}
              <EventFunctionsPicker
                value={newLead.event_type}
                onChange={(val) => setNewLead({ ...newLead, event_type: val })}
                label="Event Functions *"
                allowCustom={true}
              />

              {/* Row 2: Event Date & City */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Event Date</label>
                  <input
                    type="date"
                    className="input"
                    value={newLead.event_date}
                    onChange={(e) => setNewLead({ ...newLead, event_date: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">City / Destination</label>
                  <input
                    className="input"
                    value={newLead.event_city}
                    onChange={(e) => setNewLead({ ...newLead, event_city: e.target.value })}
                    placeholder="e.g. Udaipur, Mumbai"
                  />
                </div>
              </div>

              {/* Row 3: Quoted Fee / Commercials */}
              <div className="input-group">
                <label className="input-label">Quoted Fee / Amount (₹)</label>
                <input
                  className="input"
                  type="text"
                  value={newLead.budget_range}
                  onChange={(e) => setNewLead({ ...newLead, budget_range: e.target.value })}
                  placeholder="e.g. 45000 or Under Discussion"
                />
              </div>

              {/* Row 4: Lead Channel & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Lead Source / Channel</label>
                  <select
                    className="input"
                    value={newLead.lead_channel}
                    onChange={(e) => {
                      const channel = e.target.value;
                      setNewLead({
                        ...newLead,
                        lead_channel: channel,
                        source: channel === 'Referral' ? 'referral' : 'direct',
                      });
                    }}
                  >
                    <option value="Phone Call">📞 Direct Phone Call</option>
                    <option value="WhatsApp">💬 WhatsApp Direct</option>
                    <option value="Instagram DM">📸 Instagram DM</option>
                    <option value="Referral">🤝 Referral / Word of Mouth</option>
                    <option value="Event Agency">🏢 Event Management Agency</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Initial Pipeline Status</label>
                  <select
                    className="input"
                    value={newLead.status}
                    onChange={(e) => setNewLead({ ...newLead, status: e.target.value as InquiryStatus })}
                  >
                    <option value="new">New (Need to call)</option>
                    <option value="contacted">Contacted (In discussion)</option>
                    <option value="converted">Converted (Booked)</option>
                  </select>
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="input-group">
                <label className="input-label">Client Email (Optional)</label>
                <input
                  type="email"
                  className="input"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="client@gmail.com"
                />
              </div>

              {/* Notes */}
              <div className="input-group">
                <label className="input-label">Conversation Notes & Requirements</label>
                <textarea
                  className="input textarea"
                  rows={3}
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="e.g. Quoted ₹50,000 for Sangeet. Client asked for video showreels on WhatsApp. Follow up tomorrow."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAddModal(false)}
                disabled={isPending}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ background: '#25D366', borderColor: '#25D366', color: '#fff', gap: '6px' }}
                  onClick={() => handleCreateLead(true)}
                  disabled={isPending}
                >
                  <MessageCircle size={15} /> Save & Open WhatsApp
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCreateLead(false)}
                  disabled={isPending}
                  style={{ gap: '6px' }}
                >
                  {isPending ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                  Save Lead to CRM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingInquiry}
        onClose={() => setDeletingInquiry(null)}
        onConfirm={handleConfirmDelete}
        title="Delete This Lead?"
        description={`Are you sure you want to delete "${deletingInquiry?.name}" from your CRM? This action cannot be undone.`}
        confirmText="Yes, Delete Lead"
        cancelText="Cancel"
        variant="danger"
        isLoading={isPending}
      />
    </div>
  );
}
