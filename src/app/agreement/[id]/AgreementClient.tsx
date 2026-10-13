'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  PenTool,
  RotateCcw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { formatINR, formatEventDate } from '@/lib/utils';
import { signAgreement } from '@/lib/actions/agreements';

interface AgreementClientProps {
  booking: any;
  profile: any;
}

export function AgreementClient({ booking, profile }: AgreementClientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(booking.client_name || '');
  const [signerRole, setSignerRole] = useState('Event Organizer / Host');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Check if already signed
  const parseEsignData = () => {
    if (booking.notes && booking.notes.includes('---E_SIGN_DATA---')) {
      try {
        const parts = booking.notes.split(/---E_SIGN_DATA---\n?/);
        const second = parts[1]?.split(/---END_E_SIGN---/)[0]?.trim();
        if (second) return JSON.parse(second);
      } catch (e) {
        console.warn('Could not parse esign data', e);
      }
    }
    return null;
  };

  const initialEsign = parseEsignData();
  const [esignData, setEsignData] = useState<any>(initialEsign);

  const agreementNo = `BMA-AGR-${booking.date.replace(/-/g, '')}-${(booking.id || '01').slice(0, 4).toUpperCase()}`;

  // Canvas drawing setup
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignSubmit = async () => {
    setErrorMessage('');
    if (!signerName.trim()) {
      setErrorMessage('Please enter your full name as authorized signatory.');
      return;
    }
    if (!hasDrawn || !canvasRef.current) {
      setErrorMessage('Please draw your digital signature on the signature pad.');
      return;
    }

    const signatureDataUrl = canvasRef.current.toDataURL('image/png');
    setIsSubmitting(true);

    try {
      const res = await signAgreement(booking.id, {
        signerName: signerName.trim(),
        signatureDataUrl,
        signerPhone: booking.client_phone,
        signerEmail: booking.client_email,
      });

      if (res.success) {
        setEsignData({
          status: 'EXECUTED',
          signer_name: signerName.trim(),
          signed_at: res.signedAt,
          signature_data_url: signatureDataUrl,
          hash: res.hash,
        });
      } else {
        setErrorMessage(res.error || 'Failed to record signature.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while saving signature.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const totalFee = booking.amount || 50000;
  const advanceAmount = Math.round(totalFee * 0.5);
  const balanceDue = Math.max(0, totalFee - advanceAmount);

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b14', color: '#1e293b', padding: '32px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Floating Action Bar */}
      <div style={{ maxWidth: '820px', margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Link href={`/${profile.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
          ← Back to {profile.name}&apos;s Portfolio
        </Link>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyLink}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} /> {copied ? 'Link Copied!' : 'Copy Agreement Link'}
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Printer size={14} /> Print / PDF
          </button>
          <Link
            href={`/receipt/${booking.id}`}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: '#6C5CE7',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ExternalLink size={14} /> View Token Slip
          </Link>
        </div>
      </div>

      {/* Main Printable Legal Sheet */}
      <main
        id="printable-agreement"
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '44px 48px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6C5CE7' }}>
              BookMyArtist · Verified Legal Instrument
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '4px 0 2px', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              Performance Engagement Agreement
            </h1>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Ref: <strong style={{ color: '#0f172a' }}>{agreementNo}</strong> · Execution Protocol: Electronic Signatures Act (IT Act 2000, Sec 10A)
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 700,
                background: esignData?.status === 'EXECUTED' ? '#dcfce7' : '#fef3c7',
                color: esignData?.status === 'EXECUTED' ? '#15803d' : '#b45309',
                border: `1px solid ${esignData?.status === 'EXECUTED' ? '#86efac' : '#fde68a'}`,
              }}
            >
              {esignData?.status === 'EXECUTED' ? (
                <>
                  <CheckCircle2 size={13} /> EXECUTED &amp; SIGNED
                </>
              ) : (
                <>
                  <ShieldCheck size={13} /> PENDING CLIENT E-SIGN
                </>
              )}
            </span>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Contracting Parties */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Party of the First Part (Performing Artist)
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{profile.name}</div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{profile.tagline || 'Live Artist & Stage Performer'}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Contact: +91 {profile.whatsapp_number || profile.phone || 'Direct Artist Line'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Portfolio: bookmyartist.in/{profile.slug}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Party of the Second Part (Client / Event Host)
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {esignData?.signer_name || booking.client_name || 'Client / Event Host'}
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{signerRole}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Phone: {booking.client_phone || 'Provided via Booking Inquiry'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Email: {booking.client_email || 'Direct Client Email'}
            </div>
          </div>
        </div>

        {/* Engagement Details */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '12px' }}>
            1. Engagement Scope, Venue &amp; Schedule
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '13px' }}>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Event Name</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{booking.event_name || booking.event_type || 'Special Event'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Performance Date</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatEventDate(booking.date)}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Stage Call Slot</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{booking.slot_type?.toUpperCase() || 'FULL DAY'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>City &amp; Venue</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{booking.city || profile.city || 'India'}</div>
            </div>
          </div>
        </div>

        {/* Commercial Milestones */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '12px' }}>
            2. Financial Honorarium &amp; Milestone Schedule
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '8px 12px', color: '#475569' }}>Milestone Scope</th>
                <th style={{ padding: '8px 12px', color: '#475569' }}>Terms</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>Total Agreed Artist Honorarium</td>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>Live hosting, stage presence &amp; ceremony coordination</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{formatINR(totalFee)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#faf5ff' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#7c3aed' }}>Advance Token (Slot Lock)</td>
                <td style={{ padding: '10px 12px', color: '#6b21a8' }}>Non-refundable calendar reservation fee</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#7c3aed' }}>– {formatINR(advanceAmount)}</td>
              </tr>
              <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                <td style={{ padding: '10px 12px', color: '#0f172a' }}>Balance Fee Due on Event Day</td>
                <td style={{ padding: '10px 12px', color: '#475569', fontWeight: 500 }}>Payable directly to artist prior to stage entry</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0f172a', fontSize: '14px' }}>{formatINR(balanceDue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 7 Standard Legal Clauses */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '12px' }}>
            3. Operational &amp; Legal Terms of Engagement (7 Standard Clauses)
          </h3>
          <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.65, display: 'grid', gap: '8px' }}>
            <div>
              <strong>Clause 1 (Punctuality &amp; Sound Check):</strong> The Artist shall arrive at the venue at least 45 minutes prior to guest seating for audio checks and stage briefing.
            </div>
            <div>
              <strong>Clause 2 (Direct Balance Settlement):</strong> The remaining commercial balance shall be cleared directly to the artist on the date of performance prior to the artist stepping onto the stage.
            </div>
            <div>
              <strong>Clause 3 (Audio Production &amp; Tech Rider):</strong> The Client/sound vendor shall provide two (2) UHF wireless microphones (Shure / Sennheiser or equivalent) with fresh batteries and stage monitoring.
            </div>
            <div>
              <strong>Clause 4 (Green Room Hospitality):</strong> Client agrees to provide a secure, air-conditioned green room with mirror, clean drinking water, and safe storage for wardrobe.
            </div>
            <div>
              <strong>Clause 5 (Exclusivity &amp; Non-Refundable Advance):</strong> The artist holds this date exclusively. In case of client cancellation, the advance token is non-refundable as the artist declines competing bookings.
            </div>
            <div>
              <strong>Clause 6 (Force Majeure &amp; Safe Stage):</strong> Neither party shall be liable for cancellations arising from natural disasters, government curfews, or power failure. The artist reserves the right to pause performance if stage safety is compromised.
            </div>
            <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px', borderLeft: '3px solid #6C5CE7' }}>
              <strong>Clause 7 (Zero Escrow &amp; Software Provider Disclaimer):</strong> BookMyArtist provides digital agreement and scheduling software. BookMyArtist is NOT an escrow agent, broker, or party to this agreement. All contracts, performance responsibilities, and financial transactions are executed 100% directly between the Artist and the Client.
            </div>
          </div>
        </div>

        {/* E-Signature Execution Block */}
        <div style={{ borderTop: '2px solid #0f172a', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '16px' }}>
            4. Execution &amp; Electronic Signatures
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Artist Seal */}
            <div style={{ border: '1.5px solid #6C5CE7', padding: '16px', borderRadius: '12px', background: 'rgba(108, 92, 231, 0.03)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6C5CE7', textTransform: 'uppercase' }}>
                Party of the First Part · Artist E-Seal
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#4338ca', marginTop: '12px' }}>
                {profile.name}
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                ✓ Digitally Pre-Authorized via BookMyArtist ID
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                Ref: {agreementNo} · Verified Identity
              </div>
            </div>

            {/* Client Signature Area */}
            {esignData?.status === 'EXECUTED' ? (
              <div style={{ border: '1.5px solid #10b981', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.03)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                  Party of the Second Part · Client Digital E-Sign
                </div>
                <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                  {esignData.signature_data_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={esignData.signature_data_url} alt="Signature" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{esignData.signer_name}</span>
                  )}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {esignData.signer_name}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Signed: {new Date(esignData.signed_at).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '9px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                  Hash: {esignData.hash}
                </div>
              </div>
            ) : (
              <div style={{ border: '2px dashed #94a3b8', padding: '16px', borderRadius: '12px', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Client E-Signature Pad (Finger / Stylus)
                  </span>
                  {hasDrawn && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      style={{ fontSize: '11px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <RotateCcw size={11} /> Clear
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative', width: '100%', height: '110px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={110}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                    style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
                  />
                  {!hasDrawn && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#94a3b8', fontSize: '12px', gap: '6px' }}>
                      <PenTool size={14} /> Draw your signature with finger on mobile or mouse
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Signer Full Name (Authorized Signatory)"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                {errorMessage && (
                  <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px' }}>
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSignSubmit}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#6C5CE7',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isSubmitting ? 'Recording E-Sign...' : 'Sign & Execute Agreement ✍️'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
