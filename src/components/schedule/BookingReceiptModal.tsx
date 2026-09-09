'use client';

import { useState } from 'react';
import {
  Receipt,
  Printer,
  Copy,
  Check,
  X,
  MessageCircle,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Edit2,
  Save,
  Eye,
  FileText,
  User,
  CreditCard,
  Loader2,
  Briefcase,
  ScrollText,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { formatINR, formatEventDate } from '@/lib/utils';
import styles from './BookingReceiptModal.module.css';

export interface BookingReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id?: string;
    event_name?: string;
    event_type?: string;
    date: string;
    slot_type: string;
    event_time?: string;
    amount?: number | null;
    client_name?: string;
    client_phone?: string;
    client_email?: string;
    city?: string;
    venue?: string;
    notes?: string;
  };
  anchorProfile: {
    name: string;
    tagline?: string;
    phone?: string;
    whatsapp_number?: string;
    email?: string;
    slug?: string;
    city?: string;
  };
  onUpdateBooking?: (updatedData: {
    client_name?: string;
    client_phone?: string;
    client_email?: string;
    event_name?: string;
    venue?: string;
    city?: string;
    amount?: number | null;
    advance_paid?: number;
    payment_mode?: string;
    receipt_config?: {
      service_title?: string;
      service_description?: string;
      terms_title?: string;
      terms_and_conditions?: string;
    };
    notes?: string;
  }) => Promise<void>;
  onOpenFullEdit?: (booking: any) => void;
}

const DEFAULT_TERMS = `1. Sound & Mic Testing: Wireless handheld microphone & sound system line-check 45 minutes prior to guest arrival.
2. Balance Settlement: Remaining balance payment to be cleared on event day prior to stage performance.
3. Exclusivity: The anchor has locked this date exclusively for the host. Advance token confirms and reserves the slot on the calendar.`;

function extractJsonObject(str: string): string | null {
  const start = str.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          return str.slice(start, i + 1);
        }
      }
    }
  }
  return null;
}

export function BookingReceiptModal({
  isOpen,
  onClose,
  booking,
  anchorProfile,
  onUpdateBooking,
  onOpenFullEdit,
}: BookingReceiptModalProps) {
  // Parse existing receipt config and token info from booking.notes
  const parseReceiptMeta = (notesStr?: string) => {
    let cfg: any = {};
    if (notesStr && notesStr.includes('---RECEIPT_CONFIG---')) {
      try {
        const parts = notesStr.split(/---RECEIPT_CONFIG---\n?/);
        const jsonStr = extractJsonObject(parts[1] || '') || parts[1]?.trim() || '{}';
        cfg = JSON.parse(jsonStr);
      } catch (err) {
        console.warn('Failed to parse receipt config:', err);
      }
    }
    const match = (notesStr || '').match(/\[TOKEN_ADVANCE:\s*([0-9.]+)(?:\|([^|\]]*))?(?:\|([^\]]*))?\]/);
    const advanceFromTag = match ? Number(match[1]) : null;
    const modeFromTag = match ? match[2]?.trim() : 'UPI';

    const parsedAdvance =
      cfg.advance_paid !== undefined && cfg.advance_paid !== null && !isNaN(Number(cfg.advance_paid))
        ? Number(cfg.advance_paid)
        : advanceFromTag;

    return {
      advance: parsedAdvance,
      mode: cfg.payment_mode || modeFromTag || 'UPI',
      ref: cfg.payment_ref || '',
      service_title: cfg.service_title || 'Stage Hosting & Emcee Services',
      service_description: cfg.service_description || 'Live hosting, audience engagement, ceremony protocol coordination',
      terms_title: cfg.terms_title || 'Standard Engagement Terms & Rider',
      terms_and_conditions: cfg.terms_and_conditions || DEFAULT_TERMS,
    };
  };

  const parsed = parseReceiptMeta(booking.notes);
  const initialTotal = booking.amount || 35000;
  const initialAdvance = parsed.advance !== null ? parsed.advance : Math.round(initialTotal * 0.3);

  // Tab mode: 'preview' or 'edit'
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Editable Form State
  const [formData, setFormData] = useState({
    client_name: booking.client_name || '',
    client_phone: booking.client_phone || '',
    client_email: booking.client_email || '',
    event_name: booking.event_name || booking.event_type || 'Show Event',
    city: booking.city || '',
    venue: booking.venue || '',
    amount: booking.amount ? booking.amount.toString() : '35000',
    advancePaid: initialAdvance,
    paymentMode: parsed.mode || 'UPI',
    paymentRef: parsed.ref || '',
    service_title: parsed.service_title,
    service_description: parsed.service_description,
    terms_title: parsed.terms_title,
    terms_and_conditions: parsed.terms_and_conditions,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentTotal = Number(formData.amount) || 0;
  const currentAdvance = formData.advancePaid || 0;
  const balanceDue = Math.max(0, currentTotal - currentAdvance);

  const receiptNo = `SH-REC-${booking.date.replace(/-/g, '')}-${(booking.id || '01').slice(0, 4).toUpperCase()}`;

  const publicReceiptUrl = typeof window !== 'undefined' && booking.id
    ? `${window.location.origin}/receipt/${booking.id}`
    : `https://stagehost.in/receipt/${booking.id || ''}`;

  const slotName =
    booking.slot_type === 'morning'
      ? '☀️ Morning Show (10:00 AM – 02:30 PM)'
      : booking.slot_type === 'evening'
        ? '🌙 Evening Function (07:00 PM – 11:30 PM)'
        : '💍 Full Day Double Header (Morning + Evening)';

  const handlePrint = () => {
    window.print();
  };

  const whatsappConfirmationText = `🧾 *OFFICIAL BOOKING CONFIRMATION & TOKEN RECEIPT*
Receipt Ref: *${receiptNo}*

🎤 *Anchor & Emcee:* ${anchorProfile.name.toUpperCase()}
${anchorProfile.tagline ? `_${anchorProfile.tagline}_\n` : ''}
👤 *Client / Host:* ${formData.client_name || 'Valued Client'}
${formData.client_phone ? `📞 *Contact:* ${formData.client_phone}\n` : ''}🎉 *Event:* ${formData.event_name}
📅 *Date:* ${formatEventDate(booking.date)}
⏰ *Show Timing / Slot:* ${booking.event_time ? `${booking.event_time} (${slotName})` : slotName}
📍 *Venue & City:* ${formData.venue ? `${formData.venue}, ` : ''}${formData.city || anchorProfile.city || 'India'}

🛠️ *Service Deliverables:*
${formData.service_title}
_${formData.service_description}_

💰 *COMMERCIAL BREAKDOWN:*
• Total Agreed Fee: ${formatINR(currentTotal)}
• Advance Token Received: ${formatINR(currentAdvance)} ✅ (${formData.paymentMode}${formData.paymentRef ? ` · ${formData.paymentRef}` : ''})
• *Remaining Balance Due on Event Day:* ${formatINR(balanceDue)} ⏳
• Booking Status: *TOKEN CONFIRMED & CALENDAR LOCKED* 🔒

📌 *${formData.terms_title.toUpperCase()}:*
${formData.terms_and_conditions}

📄 *View & Print Official Slip Online:*
${publicReceiptUrl}

🌐 *Artist Portfolio:*
https://stagehost.in/${anchorProfile.slug || ''}

_Created with StageHost_

Thank you for confirming with ${anchorProfile.name}! Looking forward to a blockbuster event! 🌟`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappConfirmationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy receipt text:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicReceiptUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy public link:', err);
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = (formData.client_phone || '').replace(/\D/g, '');
    const phoneParam = cleanPhone ? (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`) : '';
    const url = phoneParam
      ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(whatsappConfirmationText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappConfirmationText)}`;
    window.open(url, '_blank');
  };

  const setTokenByPercent = (percent: number) => {
    const calc = Math.round((currentTotal * percent) / 100);
    setFormData((prev) => ({ ...prev, advancePaid: calc }));
  };

  // Terms presets
  const applyTermsPreset = (type: 'wedding' | 'corporate' | 'outstation' | 'minimal') => {
    if (type === 'wedding') {
      setFormData((prev) => ({
        ...prev,
        terms_title: 'Wedding & Sangeet Engagement Rider',
        terms_and_conditions: `1. Sound & Mic Testing: Wireless handheld microphone & sound system line-check 45 minutes prior to guest arrival.
2. Balance Settlement: Remaining balance payment to be cleared on event day prior to stage performance.
3. Exclusivity: The anchor has locked this date exclusively for the host. Advance token confirms and reserves the slot on the calendar.
4. Family Protocol: Host to provide bride & groom entry cues and VIP family names 24 hours prior.`,
      }));
    } else if (type === 'corporate') {
      setFormData((prev) => ({
        ...prev,
        terms_title: 'Corporate Summit & Gala Terms',
        terms_and_conditions: `1. Technical Line-Check: Wireless lapel / handheld mic and presenter clicker testing 1 hour prior to opening keynote.
2. Stage Protocol: All presenter run-sheets, award sequences, and brand decks to be shared with anchor in advance.
3. Settlement: Remaining balance payment to be cleared against invoice on event date before stage departure.`,
      }));
    } else if (type === 'outstation') {
      setFormData((prev) => ({
        ...prev,
        terms_title: 'Outstation Destination Travel & Rider',
        terms_and_conditions: `1. Travel & Lodging: Return flights/travel tickets and 4/5-star hotel accommodation arranged by client/organizer.
2. Local Conveyance: Safe airport-hotel-venue transfers arranged with local coordinator.
3. Payment Clearance: Advance token locks calendar. Balance payment settled before artist leaves green room for stage.`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        terms_title: 'Standard Terms & Conditions',
        terms_and_conditions: `1. Technical sound check 45 minutes prior to show commencement.
2. Balance payment of ${formatINR(balanceDue)} to be settled on event date prior to stage step-up.
3. Advance token locks this date exclusively on the calendar.`,
      }));
    }
  };

  // Save changes to database
  const handleSaveChanges = async () => {
    if (!onUpdateBooking) {
      setActiveTab('preview');
      return;
    }

    try {
      setIsSaving(true);
      await onUpdateBooking({
        client_name: formData.client_name.trim(),
        client_phone: formData.client_phone.trim(),
        client_email: formData.client_email.trim(),
        event_name: formData.event_name.trim(),
        venue: formData.venue.trim(),
        city: formData.city.trim(),
        amount: currentTotal > 0 ? currentTotal : null,
        advance_paid: currentAdvance,
        payment_mode: `${formData.paymentMode}${formData.paymentRef ? `|${formData.paymentRef}` : ''}`,
        receipt_config: {
          service_title: formData.service_title.trim(),
          service_description: formData.service_description.trim(),
          terms_title: formData.terms_title.trim(),
          terms_and_conditions: formData.terms_and_conditions.trim(),
        },
      });
      setActiveTab('preview');
    } catch (err: any) {
      alert(err?.message || 'Failed to update slip details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <div className={styles.title}>
              <Receipt size={18} color="var(--color-primary, #6c5ce7)" />
              <span>Token Receipt</span>
            </div>

            {/* Segmented Switcher */}
            <div className={styles.tabSwitch}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                <Eye size={13} />
                View & Print Slip
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'edit' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                <Edit2 size={13} />
                Edit Slip Data
              </button>
            </div>
          </div>

          <div className={styles.headerActions}>
            {onOpenFullEdit && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenFullEdit(booking)}
                style={{ fontSize: '11px', padding: '5px 9px', gap: '5px' }}
                title="Open full booking editor with timing, cue notes & travel buffer"
              >
                <FileText size={13} />
                Full Booking Edit
              </button>
            )}

            {booking.id && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyLink}
                  style={{ gap: '6px' }}
                  title="Copy direct shareable URL for client / organizer"
                >
                  {copiedLink ? <Check size={14} color="#10B981" /> : <LinkIcon size={14} />}
                  {copiedLink ? 'Link Copied!' : 'Copy Link'}
                </button>

                <a
                  href={publicReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px', textDecoration: 'none' }}
                  title="Open live slip in browser"
                >
                  <ExternalLink size={13} />
                  View Online
                </a>
              </>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyText}
              style={{ gap: '6px' }}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              {copied ? 'Copied Text!' : 'Copy Text'}
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSendWhatsApp}
              style={{ gap: '6px', background: '#25D366', borderColor: '#25D366' }}
            >
              <MessageCircle size={14} />
              Send on WhatsApp
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ gap: '6px' }}
            >
              <Printer size={14} />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-tertiary, #94a3b8)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.scrollArea}>
          {activeTab === 'edit' ? (
            /* =======================================================
               TAB 1: INLINE QUICK EDIT FORM
               ======================================================= */
            <div className={styles.editContainer}>
              {/* Section 1: Client & Organizer */}
              <div className={styles.editCard}>
                <div className={styles.sectionHeader}>
                  <User size={15} color="var(--color-primary, #6c5ce7)" />
                  Client & Organizer Information
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Client / Host Name *</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. Mr. Rohit Singhal & Family, Groom Father"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Client Phone / WhatsApp</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. +91 98201 12345"
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Client Email (Optional)</label>
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="e.g. client@example.com"
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>City</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. Surat, Udaipur, Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Event & Venue Details */}
              <div className={styles.editCard}>
                <div className={styles.sectionHeader}>
                  <MapPin size={15} color="#10B981" />
                  Event & Venue Details
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Event / Show Name *</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. Grand Sangeet & Reception"
                      value={formData.event_name}
                      onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Venue / Hotel</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. The Grand Bhagwati, Surat"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Commercials & Advance Token */}
              <div className={styles.editCard}>
                <div className={styles.sectionHeader}>
                  <CreditCard size={15} color="#F59E0B" />
                  Commercials & Token Payment Status
                </div>
                <div className={styles.formGrid3}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Total Agreed Commercial Fee (₹)</label>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="e.g. 50000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Advance Token Received (₹)</label>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="e.g. 15000"
                      value={formData.advancePaid}
                      onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) || 0 })}
                    />
                    <div className={styles.quickChips}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Quick Token:</span>
                      {[20, 25, 30, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          className={`${styles.chip} ${formData.advancePaid === Math.round((currentTotal * pct) / 100) ? styles.chipActive : ''}`}
                          onClick={() => setTokenByPercent(pct)}
                        >
                          {pct === 100 ? 'Full' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Remaining Balance Due (₹)</label>
                    <div
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        color: '#FBBF24',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {formatINR(balanceDue)}
                    </div>
                  </div>
                </div>

                <div className={styles.formGrid2} style={{ marginTop: '14px' }}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Payment Method</label>
                    <select
                      className={styles.input}
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm / BHIM)</option>
                      <option value="Bank IMPS">Bank IMPS / NEFT Transfer</option>
                      <option value="Cash">Cash Token</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Payment Reference / Txn Note (Optional)</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. UPI Ref: 4829104819 / Cheque #102934"
                      value={formData.paymentRef}
                      onChange={(e) => setFormData({ ...formData, paymentRef: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Customizable Service Scope & Deliverables */}
              <div className={styles.editCard}>
                <div className={styles.sectionHeader}>
                  <Briefcase size={15} color="#8B5CF6" />
                  Service Title & Deliverables (On Receipt Table)
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Service Line-Item Title</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. Stage Hosting & Emcee Services"
                      value={formData.service_title}
                      onChange={(e) => setFormData({ ...formData, service_title: e.target.value })}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Deliverables / Subtitle</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. Live hosting, audience engagement, ceremony protocol coordination"
                      value={formData.service_description}
                      onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Customizable Terms & Engagement Rider */}
              <div className={styles.editCard}>
                <div className={styles.sectionHeader}>
                  <ScrollText size={15} color="#38BDF8" />
                  Engagement Terms & Artist Rider
                </div>

                <div className={styles.presetBar}>
                  <span className={styles.presetLabel}>Quick Presets:</span>
                  <button
                    type="button"
                    className={styles.presetBtn}
                    onClick={() => applyTermsPreset('wedding')}
                  >
                    💍 Wedding & Sangeet
                  </button>
                  <button
                    type="button"
                    className={styles.presetBtn}
                    onClick={() => applyTermsPreset('corporate')}
                  >
                    🏢 Corporate Summit
                  </button>
                  <button
                    type="button"
                    className={styles.presetBtn}
                    onClick={() => applyTermsPreset('outstation')}
                  >
                    ✈️ Outstation & Travel
                  </button>
                  <button
                    type="button"
                    className={styles.presetBtn}
                    onClick={() => applyTermsPreset('minimal')}
                  >
                    📄 Short & Standard
                  </button>
                </div>

                <div className={styles.fieldGroup} style={{ marginBottom: '12px' }}>
                  <label className={styles.label}>Terms Box Title</label>
                  <input
                    className={styles.input}
                    placeholder="e.g. Standard Engagement Terms & Rider"
                    value={formData.terms_title}
                    onChange={(e) => setFormData({ ...formData, terms_title: e.target.value })}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Terms & Conditions (Numbered or Bullet Points)</label>
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    placeholder="Write your custom terms, sound check timing, payment rules..."
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                  />
                </div>
              </div>

              {/* Edit Footer */}
              <div className={styles.editFooter}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveTab('preview')}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveChanges}
                  disabled={isSaving || !formData.event_name.trim()}
                  style={{ gap: '8px', padding: '8px 20px' }}
                >
                  {isSaving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                  {isSaving ? 'Saving Changes...' : 'Save & Update Slip'}
                </button>
              </div>
            </div>
          ) : (
            /* =======================================================
               TAB 2: PRINTABLE LUXURY RECEIPT PAPER
               ======================================================= */
            <div className={styles.paper} id="booking-receipt-printable">
              {/* Booking Confirmation Seal */}
              <div className={styles.watermarkSeal}>
                <div className={styles.watermarkTitle}>★ TOKEN CONFIRMATION ★</div>
                <div className={styles.watermarkSub}>Direct Artist Booking</div>
              </div>

              {/* Top Bar: Anchor Branding & Slip Meta */}
              <div className={styles.docTop}>
                <div>
                  <div className={styles.brandName}>{anchorProfile.name}</div>
                  <div style={{ fontSize: '13px', color: '#6C5CE7', fontWeight: 600 }}>
                    {anchorProfile.tagline || 'Celebrity Anchor & Emcee'}
                  </div>
                  <span className={styles.docBadge}>
                    <ShieldCheck size={13} />
                    Booking Confirmed & Slot Locked
                  </span>
                </div>

                <div className={styles.metaBlock}>
                  <div className={styles.receiptNo}>{receiptNo}</div>
                  <div style={{ marginTop: '4px' }}>
                    Issue Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ fontWeight: 600, color: '#475569' }}>Artist Booking Confirmation Slip</div>
                </div>
              </div>

              {/* 2-Column Details: Client vs Event */}
              <div className={styles.grid2Col}>
                <div>
                  <div className={styles.colTitle}>
                    Client / Organizer Details
                    <button
                      type="button"
                      className={styles.sectionEditBtn}
                      onClick={() => setActiveTab('edit')}
                    >
                      <Edit2 size={9} /> Edit
                    </button>
                  </div>
                  <div className={styles.colText}>
                    {formData.client_name ? (
                      <>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formData.client_name}</strong>
                        {formData.client_phone && <div>📞 {formData.client_phone}</div>}
                        {formData.client_email && <div>✉️ {formData.client_email}</div>}
                      </>
                    ) : (
                      <button
                        type="button"
                        className={styles.emptyPrompt}
                        onClick={() => setActiveTab('edit')}
                      >
                        <Edit2 size={11} /> + Add Client Name & Phone
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className={styles.colTitle}>
                    Event & Venue Details
                    <button
                      type="button"
                      className={styles.sectionEditBtn}
                      onClick={() => setActiveTab('edit')}
                    >
                      <Edit2 size={9} /> Edit
                    </button>
                  </div>
                  <div className={styles.colText}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {formData.event_name}
                    </strong>
                    <div>📅 {formatEventDate(booking.date)}</div>
                    <div>⏰ {booking.event_time ? `${booking.event_time} (${slotName})` : slotName}</div>
                    <div>📍 {formData.venue ? `${formData.venue}, ` : ''}{formData.city || anchorProfile.city || 'India'}</div>
                  </div>
                </div>
              </div>

              {/* Financial Commercials Table */}
              <table className={styles.financialTable}>
                <thead>
                  <tr>
                    <th>
                      Description
                      <button
                        type="button"
                        className={styles.sectionEditBtn}
                        onClick={() => setActiveTab('edit')}
                        style={{ textTransform: 'none' }}
                      >
                        <Edit2 size={9} /> Edit Description
                      </button>
                    </th>
                    <th>Slot / Schedule</th>
                    <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{formData.service_title}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>
                        {formData.service_description}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {booking.slot_type === 'morning'
                        ? 'Morning Show'
                        : booking.slot_type === 'evening'
                          ? 'Evening Show'
                          : 'Full Day Event'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                      {formatINR(currentTotal)}
                    </td>
                  </tr>

                  <tr className={styles.tokenRow}>
                    <td colSpan={2}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Advance Token Received</span>
                        <span className={styles.paymentModeTag}>
                          {formData.paymentMode} {formData.paymentRef ? `· ${formData.paymentRef}` : ''}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      – {formatINR(currentAdvance)}
                    </td>
                  </tr>

                  <tr className={styles.balanceRow}>
                    <td colSpan={2}>
                      <strong>Balance Payable on Event Day (Before Stage Entry)</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatINR(balanceDue)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Customizable Standard Engagement Rider */}
              <div className={styles.termsBox}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div className={styles.termsTitle}>{formData.terms_title}</div>
                  <button
                    type="button"
                    className={styles.sectionEditBtn}
                    onClick={() => setActiveTab('edit')}
                  >
                    <Edit2 size={9} /> Edit Rider & Terms
                  </button>
                </div>
                <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {formData.terms_and_conditions}
                </div>
              </div>

              {/* Footer */}
              <div className={styles.footerBar}>
                <div>
                  <div>Direct Artist Contact: +91 {anchorProfile.whatsapp_number || anchorProfile.phone || '9820198201'}</div>
                  <div>Direct Email: {anchorProfile.email || 'bookings@stagehost.in'}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: '#6C5CE7' }}>Created with StageHost</span>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>stagehost.in/{anchorProfile.slug || ''}</div>
                </div>
              </div>

              {/* Platform Legal Disclaimer */}
              <div className={styles.platformDisclaimer}>
                Disclaimer: This booking receipt is generated by the artist for scheduling and token confirmation. StageHost is a technology platform and does not process, handle, or assume any responsibility for payments, fees, or contractual obligations between the artist and the client.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
