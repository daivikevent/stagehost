'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  Download,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Receipt,
  User,
} from 'lucide-react';
import { formatINR, formatEventDate } from '@/lib/utils';
import styles from './receipt-public.module.css';

interface ReceiptPublicClientProps {
  booking: any;
  profile: any;
}

// Helper to safely extract a complete JSON object from a string that might contain trailing text/tags
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

export function ReceiptPublicClient({ booking, profile }: ReceiptPublicClientProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'receipt' | 'contract'>('receipt');
  const [selectedTokenAmount, setSelectedTokenAmount] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccessMessage, setPaySuccessMessage] = useState<string | null>(null);
  const [currentAdvancePaid, setCurrentAdvancePaid] = useState<number | null>(null);

  // Parse receipt config & token metadata from booking.notes
  const parseConfig = (notesStr?: string) => {
    let cfg: any = {};
    if (notesStr && notesStr.includes('---RECEIPT_CONFIG---')) {
      try {
        const parts = notesStr.split(/---RECEIPT_CONFIG---\n?/);
        const jsonStr = extractJsonObject(parts[1] || '') || parts[1]?.trim() || '{}';
        cfg = JSON.parse(jsonStr);
      } catch (err) {
        console.warn('Failed to parse receipt config JSON:', err);
      }
    }
    const match = (notesStr || '').match(/\[TOKEN_ADVANCE:\s*([0-9.]+)(?:\|([^|\]]*))?(?:\|([^\]]*))?\]/);
    const advanceFromTag = match ? Number(match[1]) : null;
    const modeFromTag = match ? match[2]?.trim() : 'UPI';

    const defaultTerms = `1. Sound & Mic Testing: Wireless handheld microphone & sound system line-check 45 minutes prior to guest arrival.
2. Balance Settlement: Remaining balance payment to be cleared on event day prior to stage performance.
3. Exclusivity: The anchor has locked this date exclusively for the host. Advance token confirms and reserves the slot on the calendar.`;

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
      terms_and_conditions: cfg.terms_and_conditions || defaultTerms,
    };
  };

  const config = parseConfig(booking.notes);
  const isPencilHold = (booking.notes || '').includes('[PENCIL_HOLD]');
  const totalAmount = Number(booking.amount) || 35000;
  const initialAdvance = config.advance !== null && config.advance !== undefined ? config.advance : Math.round(totalAmount * 0.3);
  const advancePaid = currentAdvancePaid !== null ? currentAdvancePaid : initialAdvance;
  const balanceDue = Math.max(0, totalAmount - advancePaid);

  const timeMatch = (booking.notes || '').match(/\[TIME:\s*(.*?)\]/);
  const resolvedEventTime = booking.event_time || (timeMatch ? timeMatch[1].trim() : '');

  const receiptNo = `SH-REC-${booking.date.replace(/-/g, '')}-${(booking.id || '01').slice(0, 4).toUpperCase()}`;

  const slotName =
    booking.slot_type === 'morning'
      ? '☀️ Morning Show (10:00 AM – 02:30 PM)'
      : booking.slot_type === 'evening'
      ? '🌙 Evening Function (07:00 PM – 11:30 PM)'
      : '💍 Full Day Double Header (Morning + Evening)';

  // Helper to load Razorpay script on demand
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Razorpay Advance Token Payment
  const handlePayAdvance = async () => {
    const amountToPay = customAmount ? Number(customAmount) : selectedTokenAmount;
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert('Please enter a valid advance token amount.');
      return;
    }

    setIsPaying(true);
    try {
      const res = await fetch('/api/receipt/create-advance-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: amountToPay,
          clientName: booking.client_name,
          clientPhone: booking.client_phone,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || orderData.isSimulated) {
        // Simulated / Test demo payment verification
        const verifyRes = await fetch('/api/receipt/verify-advance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            amount: amountToPay,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_order_id: orderData.orderId,
            razorpay_signature: 'simulated_signature',
          }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          setCurrentAdvancePaid(verifyData.totalAdvance);
          setPaySuccessMessage(`🎉 Advance Token of ₹${amountToPay.toLocaleString('en-IN')} verified! Date slot is locked & confirmed.`);
          setIsPaying(false);
          return;
        }
      }

      // Real Razorpay Checkout flow
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: profile.name || 'StageHost Anchor',
        description: `Advance Token for ${booking.event_name || 'Show Booking'} (${formatEventDate(booking.date)})`,
        order_id: orderData.orderId,
        prefill: {
          name: booking.client_name || '',
          contact: (booking.client_phone || '').replace(/\D/g, ''),
          email: booking.client_email || '',
        },
        theme: {
          color: '#6C5CE7',
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/receipt/verify-advance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: booking.id,
                amount: amountToPay,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setCurrentAdvancePaid(verifyData.totalAdvance);
              setPaySuccessMessage(`🎉 Advance Token of ₹${amountToPay.toLocaleString('en-IN')} verified! Date slot is locked & confirmed.`);
            }
          } catch (err: any) {
            alert('Payment received but confirmation update encountered an error. Please WhatsApp artist with payment ID: ' + response.razorpay_payment_id);
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed.');
      setIsPaying(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = typeof document !== 'undefined' ? document.title : '';
    const cleanEventName = (booking.event_name || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (typeof document !== 'undefined') {
      document.title = viewMode === 'contract'
        ? `Performance_Contract_${receiptNo}_${cleanEventName}`
        : `Booking_Confirmation_${receiptNo}_${cleanEventName}`;
    }
    window.print();
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.title = originalTitle;
      }
    }, 1200);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const cleanPhone = (profile.whatsapp_number || profile.phone || '').replace(/\D/g, '');
  const phoneParam = cleanPhone ? (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`) : '';
  const whatsappUrl = phoneParam
    ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(`Hi ${profile.name}! I am viewing my booking token slip for ${booking.event_name || 'the show'} on ${formatEventDate(booking.date)} (Ref: ${receiptNo}).`)}`
    : `https://wa.me/?text=${encodeURIComponent(`Hi ${profile.name}! I am viewing my booking token slip (Ref: ${receiptNo}).`)}`;

  const clientCleanPhone = (booking.client_phone || '').replace(/\D/g, '');
  const clientPhoneParam = clientCleanPhone ? (clientCleanPhone.startsWith('91') ? clientCleanPhone : `91${clientCleanPhone}`) : '';
  const shareToClientUrl = clientPhoneParam
    ? `https://wa.me/${clientPhoneParam}?text=${encodeURIComponent(`Hi ${booking.client_name || 'Sir/Madam'}! Here is your official booking confirmation & token receipt for ${booking.event_name || 'the event'} on ${formatEventDate(booking.date)}: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`
    : null;

  return (
    <div className={styles.container}>
      {/* Top Sticky Navigation Bar with Print & Download controls */}
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <Link href={`/${profile.slug || ''}`} className={styles.logoTitle} style={{ textDecoration: 'none' }}>
            <Receipt size={18} color="#6C5CE7" />
            <span>StageHost</span>
          </Link>
          <span className={styles.badge}>
            Issued by {profile.name}
          </span>
        </div>

        {/* View Mode Switch: Slip vs Contract */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '3px' }}>
          <button
            type="button"
            onClick={() => setViewMode('receipt')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'receipt' ? '#6C5CE7' : 'transparent',
              color: viewMode === 'receipt' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 150ms ease',
            }}
          >
            🧾 Token Slip
          </button>
          <button
            type="button"
            onClick={() => setViewMode('contract')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'contract' ? '#6C5CE7' : 'transparent',
              color: viewMode === 'contract' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 150ms ease',
            }}
          >
            📄 Legal Contract (PDF)
          </button>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <Printer size={14} />
            <span>{viewMode === 'contract' ? 'Print Contract' : 'Print Receipt'}</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={handlePrint}
            title="Download PDF via print dialog"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={handleCopyLink}
          >
            {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {shareToClientUrl && (
            <a
              href={shareToClientUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
              title="Send Receipt to Client on WhatsApp"
            >
              <MessageCircle size={14} />
              <span>Send to Client</span>
            </a>
          )}

          {phoneParam && !shareToClientUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
            >
              <MessageCircle size={14} />
              <span>WhatsApp Artist</span>
            </a>
          )}

          {profile.slug && (
            <Link
              href={`/${profile.slug}`}
              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
              target="_blank"
            >
              <ExternalLink size={13} />
              <span>Artist Profile</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Paper Area */}
      <main className={styles.paperArea}>
        <div className={styles.paper} id="booking-receipt-printable">
          {/* Booking Confirmation Seal */}
          <div className={styles.watermarkSeal}>
            <div className={styles.watermarkTitle}>
              {viewMode === 'contract' ? '★ OFFICIAL AGREEMENT ★' : '★ TOKEN CONFIRMATION ★'}
            </div>
            <div className={styles.watermarkSub}>Direct Artist Booking · StageHost Verified</div>
          </div>

          {/* Top Bar: Anchor Branding & Slip Meta */}
          <div className={styles.docTop}>
            <div>
              <div className={styles.brandName}>{profile.name}</div>
              <div style={{ fontSize: '13px', color: '#6C5CE7', fontWeight: 600 }}>
                {profile.tagline || 'Celebrity Anchor & Emcee'}
              </div>
              <span className={styles.docBadge}>
                <ShieldCheck size={13} />
                {isPencilHold && advancePaid === 0 ? '⚡ Pencil Hold (Pending Advance Token)' : 'Booking Confirmed & Slot Locked'}
              </span>
            </div>

            <div className={styles.metaBlock}>
              <div className={styles.receiptNo}>{receiptNo}</div>
              <div style={{ marginTop: '4px' }}>
                Issue Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontWeight: 600, color: '#475569' }}>
                {viewMode === 'contract' ? 'Artist Performance Engagement Contract' : 'Artist Booking Confirmation Slip'}
              </div>
            </div>
          </div>

          {viewMode === 'contract' ? (
            /* ========================================= */
            /* FORMAL ARTIST ENGAGEMENT CONTRACT & INVOICE */
            /* ========================================= */
            <div style={{ marginTop: '20px' }}>
              <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '2px solid #0f172a', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a' }}>
                  Artist Performance Engagement Agreement
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Execution Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · Validated via StageHost
                </div>
              </div>

              {/* Parties */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                    Party of the First Part (Artist / Emcee)
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginTop: '4px' }}>
                    {profile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Professional Event Anchor & Host
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Contact: +91 {profile.whatsapp_number || profile.phone || 'Direct Artist Line'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Email: {profile.email || 'bookings@stagehost.in'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                    Party of the Second Part (Organizer / Client)
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginTop: '4px' }}>
                    {booking.client_name || 'Client / Event Host'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Event Organizer / Sponsoring Host
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Phone: {booking.client_phone || 'Direct Organizer Phone'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Email: {booking.client_email || 'Not Provided'}
                  </div>
                </div>
              </div>

              {/* Event Schedule Spec */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>
                  1. Event Specifications & Call Time
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
                  <div><strong>Event Name:</strong> {booking.event_name || booking.event_type || 'Show'}</div>
                  <div><strong>Performance Date:</strong> {formatEventDate(booking.date)}</div>
                  <div><strong>Stage Hours:</strong> {resolvedEventTime || slotName}</div>
                  <div><strong>Venue & Location:</strong> {booking.venue ? `${booking.venue}, ` : ''}{booking.city || profile.city || 'India'}</div>
                  <div><strong>Artist Call Time:</strong> 45 minutes prior to guest arrival</div>
                </div>
              </div>

              {/* Commercials Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>
                  2. Financial Commercials & Payment Milestones
                </div>
                <table className={styles.financialTable} style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Engagement Milestone</th>
                      <th>Payment Terms</th>
                      <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Total Agreed Artist Honorarium / Fee</td>
                      <td>Complete hosting & stage coordination</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatINR(totalAmount)}</td>
                    </tr>
                    <tr className={styles.tokenRow}>
                      <td colSpan={2}>
                        Advance Token Paid (Date Lock Guarantee)
                        <span className={styles.paymentModeTag} style={{ marginLeft: '8px' }}>
                          {config.mode} {config.ref ? `· ${config.ref}` : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#059669', fontWeight: 700 }}>– {formatINR(advancePaid)}</td>
                    </tr>
                    <tr className={balanceDue === 0 ? styles.paidInFullRow : styles.balanceRow}>
                      <td colSpan={2}>
                        <strong>Remaining Balance Due (Payable on Event Date Prior to Stage Call)</strong>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{balanceDue === 0 ? '₹0 (Paid in Full)' : formatINR(balanceDue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Technical Rider & Hospitality Terms */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>
                  3. Artist Technical Rider & Hospitality Protocol
                </div>
                <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.65, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div><strong>A. Sound & Audio:</strong> Client/Sound vendor shall provide 2x Professional UHF Wireless Handheld Microphones (Shure / Sennheiser or equivalent) with fresh batteries and stage monitor wedge. Line check at least 45 minutes prior to guest seating.</div>
                  <div style={{ marginTop: '6px' }}><strong>B. Green Room Hospitality:</strong> Dedicated, well-lit, private air-conditioned green room with full-length mirror, drinking water, and safe storage for wardrobe and personal belongings.</div>
                  <div style={{ marginTop: '6px' }}><strong>C. Exclusivity & Cancellation:</strong> The artist reserves this date exclusively for the host. Advance token is non-refundable upon cancellation as the artist declines other booking opportunities for this date.</div>
                </div>
              </div>

              {/* Digital E-Sign Authorization Stamp */}
              <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '2px solid #0f172a', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ border: '1px dashed #94a3b8', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Accepted & Authorized By Client</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginTop: '12px' }}>{booking.client_name || 'Authorized Signatory'}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>Digitally Approved & Acknowledged</div>
                </div>

                <div style={{ border: '1.5px solid #6C5CE7', padding: '12px', borderRadius: '8px', textAlign: 'center', background: 'rgba(108, 92, 231, 0.04)' }}>
                  <div style={{ fontSize: '11px', color: '#6C5CE7', textTransform: 'uppercase', fontWeight: 700 }}>Official Artist Seal & E-Signature</div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#4338CA', marginTop: '10px' }}>{profile.name}</div>
                  <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 600, marginTop: '4px' }}>
                    ✓ Digitally Verified via StageHost ID Auth
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                    Security Ref: {receiptNo} · Timestamp: {new Date().toISOString().slice(0, 10)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================= */
            /* STANDARD BOOKING RECEIPT & TOKEN SLIP */
            /* ========================================= */
            <>
              {/* 2-Column Details: Client vs Event */}
              <div className={styles.grid2Col}>
                <div>
                  <div className={styles.colTitle}>Client / Organizer Details</div>
                  <div className={styles.colText}>
                    {booking.client_name ? (
                      <>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{booking.client_name}</strong>
                        {booking.client_phone && <div>📞 {booking.client_phone}</div>}
                        {booking.client_email && <div>✉️ {booking.client_email}</div>}
                      </>
                    ) : (
                      <div style={{ color: '#64748b' }}>Direct Booking Client</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className={styles.colTitle}>Event & Venue Details</div>
                  <div className={styles.colText}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {booking.event_name || booking.event_type || 'Special Event'}
                    </strong>
                    <div>📅 {formatEventDate(booking.date)}</div>
                    <div>⏰ {resolvedEventTime ? `${resolvedEventTime} (${slotName})` : slotName}</div>
                    <div>📍 {booking.venue ? `${booking.venue}, ` : ''}{booking.city || profile.city || 'India'}</div>
                  </div>
                </div>
              </div>

              {/* Online Advance Token Payment Card (Razorpay Integration) */}
              {balanceDue > 0 && (
                <div style={{
                  margin: '20px 0',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.08), rgba(16, 185, 129, 0.08))',
                  border: '1.5px solid rgba(108, 92, 231, 0.3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={18} />
                        <span>Pay Advance Token Online to Lock Slot</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                        Instantly reserve {formatEventDate(booking.date)} exclusively on {profile.name}&apos;s verified tour calendar.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {[10000, 15000, 25000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => { setSelectedTokenAmount(amt); setCustomAmount(''); }}
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: selectedTokenAmount === amt && !customAmount ? '1.5px solid #6C5CE7' : '1px solid #cbd5e1',
                            background: selectedTokenAmount === amt && !customAmount ? 'rgba(108, 92, 231, 0.15)' : '#fff',
                            color: selectedTokenAmount === amt && !customAmount ? '#6C5CE7' : '#334155',
                          }}
                        >
                          ₹{amt.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paySuccessMessage && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontSize: '13px', fontWeight: 600 }}>
                      {paySuccessMessage}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handlePayAdvance}
                      disabled={isPaying}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #6C5CE7, #4F46E5)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: isPaying ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(108, 92, 231, 0.35)',
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>{isPaying ? 'Processing Token...' : `Pay ₹${(customAmount ? Number(customAmount) : selectedTokenAmount).toLocaleString('en-IN')} Advance (UPI / Card)`}</span>
                    </button>

                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      🔒 Secured by 256-bit Razorpay Encryption
                    </span>
                  </div>
                </div>
              )}

              {/* Financial Commercials Table */}
              <table className={styles.financialTable}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Slot / Schedule</th>
                    <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{config.service_title}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>
                        {config.service_description}
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
                      {formatINR(totalAmount)}
                    </td>
                  </tr>

                  <tr className={styles.tokenRow}>
                    <td colSpan={2}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Advance Token Received</span>
                        <span className={styles.paymentModeTag}>
                          {config.mode} {config.ref ? `· ${config.ref}` : ''}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      – {formatINR(advancePaid)}
                    </td>
                  </tr>

                  <tr className={balanceDue === 0 ? styles.paidInFullRow : styles.balanceRow}>
                    <td colSpan={2}>
                      <strong>
                        {balanceDue === 0
                          ? 'Payment Cleared in Full (No Balance Due)'
                          : 'Balance Payable on Event Day (Before Stage Entry)'}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {balanceDue === 0 ? '₹0' : formatINR(balanceDue)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Engagement Terms & Rider */}
              <div className={styles.termsBox}>
                <div className={styles.termsTitle}>{config.terms_title}</div>
                <div style={{ whiteSpace: 'pre-line', lineHeight: 1.65 }}>
                  {config.terms_and_conditions}
                </div>
              </div>
            </>
          )}

          {/* Footer Bar */}
          <div className={styles.footerBar}>
            <div>
              <div>Direct Artist Contact: +91 {profile.whatsapp_number || profile.phone || '9820198201'}</div>
              <div>Direct Email: {profile.email || 'bookings@stagehost.in'}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 700, color: '#6C5CE7' }}>Created with StageHost</span>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>stagehost.in/{profile.slug || ''}</div>
            </div>
          </div>

          {/* Legal Platform Disclaimer */}
          <div className={styles.platformDisclaimer}>
            Disclaimer: This document is issued for scheduling, contractual agreement, and token confirmation. StageHost provides technology infrastructure and is not a party to the contractual agreement between the artist and organizer.
          </div>
        </div>
      </main>
    </div>
  );
}
