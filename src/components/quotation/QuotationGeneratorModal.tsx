'use client';

import { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Sparkles,
  ShieldCheck,
  CreditCard,
  FileText,
  BadgePercent,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { formatEventDate } from '@/lib/utils';
import { BrandLogo } from '@/components/brand/BrandLogo';
import type { Inquiry, AnchorProfile } from '@/types';
import styles from './QuotationGeneratorModal.module.css';

interface QuotationGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry?: Inquiry | null;
  profile?: AnchorProfile | null;
  profileName?: string;
}

export function QuotationGeneratorModal({
  isOpen,
  onClose,
  inquiry,
  profile,
  profileName = 'Artist',
}: QuotationGeneratorModalProps) {
  const { success, error: showError } = useToast();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  // Generate Unique Quote ID: BMA-QTE-YYYY-XXXX
  const [quoteId] = useState(
    () => `BMA-QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [quoteDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Form State
  const [clientName, setClientName] = useState(inquiry?.name || '');
  const [companyName, setCompanyName] = useState('');
  const [clientPhone, setClientPhone] = useState(inquiry?.phone || '');
  const [clientEmail, setClientEmail] = useState(inquiry?.email || '');

  const [eventName, setEventName] = useState(
    inquiry?.event_type ? `${inquiry.event_type} Celebration` : 'Corporate Annual Gala'
  );
  const [eventType, setEventType] = useState(inquiry?.event_type || 'Corporate Event');
  const [eventDate, setEventDate] = useState(inquiry?.event_date || '');
  const [eventCity, setEventCity] = useState(inquiry?.event_city || profile?.city || 'Mumbai');
  const [venue, setVenue] = useState('Grand Ballroom / Main Stage');
  const [duration, setDuration] = useState('3-4 Hours Stage Time + 1 Hr Soundcheck');

  // Commercials
  const initialBaseFee = inquiry?.budget_range
    ? parseInt(inquiry.budget_range.replace(/\D/g, '') || '50000', 10)
    : (profile?.starting_price || 45000);

  const [performanceFee, setPerformanceFee] = useState<number>(initialBaseFee || 45000);
  const [soundFee, setSoundFee] = useState<number>(0);
  const [travelTerms, setTravelTerms] = useState<string>('Client Responsibility (Flights + 5-Star Stay)');
  const [gstRate, setGstRate] = useState<number>(0); // 0, 5, 18
  const [gstin, setGstin] = useState<string>('');

  // Payment Terms
  const [advancePercent, setAdvancePercent] = useState<number>(50);
  const [bankName, setBankName] = useState<string>('HDFC Bank');
  const [accountHolder, setAccountHolder] = useState<string>(profile?.name || profileName);
  const [accountNumber, setAccountNumber] = useState<string>('50100492819201');
  const [ifscCode, setIfscCode] = useState<string>('HDFC0000123');
  const [upiId, setUpiId] = useState<string>(
    `${(profile?.slug || profileName).toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`
  );

  // Deliverables Checklist
  const [deliverables, setDeliverables] = useState<string[]>([
    'Complete Stage Emceeing & High-Energy Crowd Engagement',
    'Pre-Event Scripting, Speaker Briefing & Agenda Curation',
    'Technical Console, AV & Soundcheck Coordination',
    'Audience Interactive Icebreakers & Spot Activities',
  ]);
  const [newDeliverable, setNewDeliverable] = useState('');

  if (!isOpen) return null;

  // Calculation
  const subtotal = (Number(performanceFee) || 0) + (Number(soundFee) || 0);
  const gstAmount = Math.round(subtotal * (gstRate / 100));
  const totalPayable = subtotal + gstAmount;
  const advanceAmount = Math.round(totalPayable * (advancePercent / 100));
  const balanceAmount = totalPayable - advanceAmount;

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Copy Proposal Text Handler
  const handleCopyText = () => {
    const text = `*OFFICIAL ARTIST PROPOSAL & COMMERCIAL QUOTATION*
*Reference:* ${quoteId}
*Artist:* ${profile?.name || profileName} (Verified BookMyArtist Talent)

👤 *Prepared For:* ${clientName} ${companyName ? `(${companyName})` : ''}
📅 *Event Date:* ${eventDate ? formatEventDate(eventDate) : 'TBD'}
🎉 *Event:* ${eventName} (${eventType})
📍 *Location:* ${venue}, ${eventCity}
⏱️ *Duration:* ${duration}

*COMMERCIAL BREAKDOWN:*
• Performance Fee: ₹${performanceFee.toLocaleString('en-IN')}
${soundFee > 0 ? `• Technical/AV Fee: ₹${soundFee.toLocaleString('en-IN')}\n` : ''}• Logistics/Travel: ${travelTerms}
${gstRate > 0 ? `• GST (${gstRate}%): ₹${gstAmount.toLocaleString('en-IN')}\n` : ''}*TOTAL INVESTMENT:* ₹${totalPayable.toLocaleString('en-IN')}

*PAYMENT SCHEDULE:*
• Advance Token (to lock date): ₹${advanceAmount.toLocaleString('en-IN')} (${advancePercent}%)
• Balance (prior to stage entry): ₹${balanceAmount.toLocaleString('en-IN')}

*BANK / UPI FOR ADVANCE TRANSFER:*
• Account Name: ${accountHolder}
• Bank: ${bankName}
• A/C No: ${accountNumber}
• IFSC: ${ifscCode}
• UPI ID: ${upiId}

_Generated via BookMyArtist.in Verified Artist Platform_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    success('Proposal text copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const cleanPhone = (clientPhone || '').replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = `Hi ${clientName}! 👋

Here is the official performance proposal & commercial quotation for *${eventName}* on *${eventDate ? formatEventDate(eventDate) : 'the event date'}*.

📄 *Proposal Ref:* ${quoteId}
⭐ *Artist:* ${profile?.name || profileName}
💰 *Total Commercial:* ₹${totalPayable.toLocaleString('en-IN')}
🔒 *Advance to Block Date:* ₹${advanceAmount.toLocaleString('en-IN')} (${advancePercent}%)

*Bank & UPI for Immediate Token:*
• UPI ID: ${upiId}
• A/C: ${accountNumber} (${ifscCode})

Please let us know once transferred so we can officially lock the date on the calendar!`;

    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-quotation-sheet, #printable-quotation-sheet * {
            visibility: visible !important;
          }
          #printable-quotation-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            z-index: 9999999 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
      <div
        className={styles.overlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
      <div className={styles.dialog}>
        {/* Modal Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarBrand}>
            <span className={styles.topBarIcon}>
              <FileText size={18} />
            </span>
            <div>
              <h3 className={styles.topBarTitle}>
                PDF Quotation & Rate Card Studio
              </h3>
              <p className={styles.topBarSubtitle}>
                Ref: <strong style={{ color: '#D4AF37' }}>{quoteId}</strong> · Branded Client Proposal
              </p>
            </div>
          </div>

          <div className={styles.topBarActions}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8972E 100%)',
                color: '#000',
                fontWeight: 700,
                fontSize: '12px',
                gap: '6px',
              }}
            >
              <Printer size={14} /> <span className={styles.hideOnSmallPhone}>Download / </span>Print PDF
            </button>

            {clientPhone && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleShareWhatsApp}
                style={{
                  background: '#25D366',
                  borderColor: '#25D366',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '12px',
                  gap: '6px',
                }}
              >
                <Share2 size={14} /> WhatsApp
              </button>
            )}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleCopyText}
              style={{ fontSize: '12px', gap: '6px' }}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              style={{ padding: '6px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className={styles.mobileNavTabs}>
          <button
            type="button"
            className={`${styles.mobileTabBtn} ${mobileTab === 'edit' ? styles.mobileTabBtnActive : ''}`}
            onClick={() => setMobileTab('edit')}
          >
            <FileText size={14} /> 📝 Edit Quotation
          </button>
          <button
            type="button"
            className={`${styles.mobileTabBtn} ${mobileTab === 'preview' ? styles.mobileTabBtnActive : ''}`}
            onClick={() => setMobileTab('preview')}
          >
            <Printer size={14} /> 📄 Preview Proposal (PDF)
          </button>
        </div>

        {/* Content Body: Left Controls, Right Document Preview */}
        <div className={styles.contentBody}>
          {/* Controls Column */}
          <div className={`${styles.controlsColumn} ${mobileTab === 'preview' ? styles.hideOnMobile : ''}`}>
            {/* Section 1: Client & Event */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#D4AF37', letterSpacing: '0.05em' }}>
                1. Client & Event Details
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <input
                  className="input input-sm"
                  placeholder="Client / Host Name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                <input
                  className="input input-sm"
                  placeholder="Company / Family Name (Optional)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <div className={styles.controlRow2}>
                  <input
                    className="input input-sm"
                    placeholder="Phone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                  <input
                    className="input input-sm"
                    placeholder="Email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                <input
                  className="input input-sm"
                  placeholder="Event Name (e.g. Sangeet / Gala)"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
                <div className={styles.controlRow2}>
                  <input
                    type="date"
                    className="input input-sm"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                  <input
                    className="input input-sm"
                    placeholder="City"
                    value={eventCity}
                    onChange={(e) => setEventCity(e.target.value)}
                  />
                </div>
                <input
                  className="input input-sm"
                  placeholder="Venue (e.g. Grand Hyatt)"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>
            </div>

            {/* Section 2: Commercial Investment */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#D4AF37', letterSpacing: '0.05em' }}>
                2. Commercial Fees & Taxes
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#A0A0B0' }}>Performance Honorarium (₹)</span>
                  <input
                    type="number"
                    className="input input-sm"
                    value={performanceFee}
                    onChange={(e) => setPerformanceFee(Number(e.target.value))}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#A0A0B0' }}>Sound & AV Setup (₹, Optional)</span>
                  <input
                    type="number"
                    className="input input-sm"
                    placeholder="0 if arranged by venue"
                    value={soundFee || ''}
                    onChange={(e) => setSoundFee(Number(e.target.value))}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#A0A0B0' }}>Outstation Travel & Stay</span>
                  <input
                    className="input input-sm"
                    value={travelTerms}
                    onChange={(e) => setTravelTerms(e.target.value)}
                  />
                </div>
                <div className={styles.controlRow2}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#A0A0B0' }}>GST Rate</span>
                    <select
                      className="input input-sm"
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                    >
                      <option value={0}>0% (Exempt / Nil)</option>
                      <option value={5}>5% Composition</option>
                      <option value={18}>18% GST (Official Invoice)</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#A0A0B0' }}>Advance Token %</span>
                    <select
                      className="input input-sm"
                      value={advancePercent}
                      onChange={(e) => setAdvancePercent(Number(e.target.value))}
                    >
                      <option value={25}>25% Advance</option>
                      <option value={50}>50% Advance (Standard)</option>
                      <option value={100}>100% Full Payment</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Bank & Settlement Details */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#D4AF37', letterSpacing: '0.05em' }}>
                3. Settlement & Bank Account
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <input
                  className="input input-sm"
                  placeholder="UPI ID (VPA) / GPay"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <div className={styles.controlRow2}>
                  <input
                    className="input input-sm"
                    placeholder="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                  <input
                    className="input input-sm"
                    placeholder="IFSC Code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                  />
                </div>
                <input
                  className="input input-sm"
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live High-Fidelity Printable PDF Preview */}
          <div className={`${styles.previewColumn} ${mobileTab === 'edit' ? styles.hideOnMobile : ''}`}>
            {/* The A4 Printable Paper */}
            <div
              id="printable-quotation-sheet"
              ref={printAreaRef}
              className={styles.paperSheet}
            >
              {/* Header Letterhead */}
              <div className={styles.sheetHeader}>
                <div>
                  {/* Official BookMyArtist Brand Logo */}
                  <div style={{ marginBottom: '8px' }}>
                    <BrandLogo variant="quotation" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #FF7A00 0%, #FF007A 50%, #7928CA 100%)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      VERIFIED TALENT
                    </span>
                    <span style={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>
                      OFFICIAL COMMERCIAL PROPOSAL
                    </span>
                  </div>
                  <h1 style={{ margin: '6px 0 2px 0', fontSize: '24px', fontWeight: 800, color: '#111' }}>
                    {profile?.name || profileName}
                  </h1>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 500 }}>
                    {profile?.tagline || 'Professional Stage Host & Live Performer'}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#888' }}>
                    📍 {eventCity} · 📱 +91 {profile?.phone || profile?.whatsapp_number || '9820198201'} · 🌐 bookmyartist.in/{profile?.slug || 'artist'}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      background: '#F9F6EE',
                      border: '1px solid #E8DFCA',
                      padding: '8px 12px',
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>
                      Quotation Ref
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#B8860B' }}>
                      {quoteId}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                      Date: {quoteDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client & Event Scope Grid */}
              <div className={styles.sheetScopeGrid}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#888' }}>
                    CLIENT / HOST
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginTop: '2px' }}>
                    {clientName || 'Valued Client'}
                  </div>
                  {companyName && (
                    <div style={{ fontSize: '12px', color: '#555' }}>{companyName}</div>
                  )}
                  {clientPhone && (
                    <div style={{ fontSize: '11px', color: '#666' }}>📱 +91 {clientPhone}</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#888' }}>
                    EVENT DETAILS
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginTop: '2px' }}>
                    {eventName} ({eventType})
                  </div>
                  <div style={{ fontSize: '11px', color: '#444' }}>
                    📅 {eventDate ? formatEventDate(eventDate) : 'Date To Be Confirmed'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    📍 {venue}, {eventCity}
                  </div>
                </div>
              </div>

              {/* Scope of Deliverables */}
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#B8860B',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}
                >
                  Scope of Work & Deliverables
                </div>
                <div className={styles.deliverablesGrid}>
                  {deliverables.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        color: '#333',
                      }}
                    >
                      <CheckCircle2 size={12} color="#10B981" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercial Investment Table */}
              <div className={styles.tableWrapper}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    minWidth: '460px',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#111', color: '#fff' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderRadius: '4px 0 0 0' }}>
                        Description
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', borderRadius: '0 4px 0 0' }}>
                        Investment (INR)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E9ECEF' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <strong>Artist Performance Honorarium</strong>
                        <div style={{ fontSize: '11px', color: '#777' }}>{duration}</div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }}>
                        ₹{performanceFee.toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {soundFee > 0 && (
                      <tr style={{ borderBottom: '1px solid #E9ECEF' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <strong>Technical / Sound Setup</strong>
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>
                          ₹{soundFee.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}

                    <tr style={{ borderBottom: '1px solid #E9ECEF' }}>
                      <td style={{ padding: '8px 12px', color: '#666' }}>
                        Travel, Boarding & Lodging
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px 12px', color: '#666' }}>
                        {travelTerms}
                      </td>
                    </tr>

                    {gstRate > 0 && (
                      <tr style={{ borderBottom: '1px solid #E9ECEF' }}>
                        <td style={{ padding: '8px 12px', color: '#666' }}>
                          GST ({gstRate}%)
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 12px', color: '#666' }}>
                          ₹{gstAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}

                    <tr style={{ background: '#F8F9FA', fontWeight: 800 }}>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#111' }}>
                        TOTAL COMMERCIAL PROPOSAL
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', fontSize: '15px', color: '#B8860B' }}>
                        ₹{totalPayable.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Schedule & Bank Settlement Card */}
              <div className={styles.paymentGrid}>
                <div>
                  <div style={{ fontWeight: 800, color: '#B8860B', marginBottom: '4px' }}>
                    PAYMENT MILESTONES
                  </div>
                  <div>• <strong>Advance ({advancePercent}%):</strong> ₹{advanceAmount.toLocaleString('en-IN')} to block date</div>
                  <div>• <strong>Balance ({100 - advancePercent}%):</strong> ₹{balanceAmount.toLocaleString('en-IN')} on event day prior to stage call</div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: '#B8860B', marginBottom: '4px' }}>
                    BANK & UPI SETTLEMENT
                  </div>
                  <div>• <strong>UPI ID:</strong> {upiId}</div>
                  <div>• <strong>A/C:</strong> {accountNumber} ({bankName})</div>
                  <div>• <strong>IFSC:</strong> {ifscCode} · Holder: {accountHolder}</div>
                </div>
              </div>

              {/* Footer Terms & Acceptance */}
              <div className={styles.termsRow}>
                <div>
                  <div>• Standard 48-hour cancellation policy applies. Advance is non-refundable upon date lock.</div>
                  <div>• Valid for 7 days from quote issue date. Subject to calendar slot availability.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#111', fontSize: '11px' }}>
                    {profile?.name || profileName}
                  </div>
                  <div>Authorized Signatory · BookMyArtist Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
