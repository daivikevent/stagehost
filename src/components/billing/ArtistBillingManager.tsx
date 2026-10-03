'use client';

import React, { useState, useTransition } from 'react';
import {
  FileText,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  ShieldCheck,
  Save,
  Loader2,
  Sparkles,
  CreditCard,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { saveArtistBillingDetails } from '@/lib/actions/billing';
import { TaxInvoiceModal } from './TaxInvoiceModal';
import { INDIAN_STATES, type ArtistBillingDetails, type TaxInvoice } from '@/types/invoice';
import styles from './ArtistBillingManager.module.css';

interface ArtistBillingManagerProps {
  initialBilling: ArtistBillingDetails | null;
  initialInvoices: TaxInvoice[];
}

export function ArtistBillingManager({
  initialBilling,
  initialInvoices,
}: ArtistBillingManagerProps) {
  const { success, error: showError } = useToast();
  const [isPending, startTransition] = useTransition();

  const [billing, setBilling] = useState<ArtistBillingDetails>(
    initialBilling || {
      businessName: '',
      gstin: '',
      pan: '',
      billingAddress: '',
      city: '',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '',
    }
  );

  const [invoices] = useState<TaxInvoice[]>(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);

  const handleStateChange = (stateName: string) => {
    const matched = INDIAN_STATES.find((s) => s.name === stateName);
    setBilling((prev) => ({
      ...prev,
      state: stateName,
      stateCode: matched ? matched.code : prev.stateCode,
    }));
  };

  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    let nextState = billing.state;
    let nextCode = billing.stateCode;

    // Auto-detect state if 2 digits entered
    if (clean.length >= 2) {
      const prefix = clean.slice(0, 2);
      const stateMatch = INDIAN_STATES.find((s) => s.code === prefix);
      if (stateMatch) {
        nextState = stateMatch.name;
        nextCode = stateMatch.code;
      }
    }

    setBilling((prev) => ({
      ...prev,
      gstin: clean,
      state: nextState,
      stateCode: nextCode,
    }));
  };

  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveArtistBillingDetails(billing);
        success('Business billing & GST details saved successfully!');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to save billing details');
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* 1. GST & Tax Invoicing Information Form */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <Building2 size={18} color="var(--color-primary, #ff007a)" />
            <span>GST &amp; Business Invoicing Details</span>
          </div>
          <span className={styles.taxBadge}>
            <ShieldCheck size={12} /> 18% Input Tax Credit (ITC)
          </span>
        </div>

        <p className={styles.cardSubtitle}>
          Enter your registered legal entity or stage business details. These will appear on all your BookMyArtist subscription tax invoices for GST compliance.
        </p>

        <form onSubmit={handleSaveBilling} className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Registered Business / Artist Name *</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="e.g. Aarav Sharma Entertainment Pvt Ltd or Rahul Sharma"
              value={billing.businessName}
              onChange={(e) => setBilling({ ...billing, businessName: e.target.value })}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              GSTIN (Goods &amp; Services Tax ID)
              <span className={styles.optionalTag}>Optional for ITC</span>
            </label>
            <input
              type="text"
              maxLength={15}
              className={styles.input}
              placeholder="15-digit GSTIN (e.g. 27ABCDE1234F1Z5)"
              value={billing.gstin || ''}
              onChange={(e) => handleGstinChange(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
            <label className={styles.label}>Billing Address *</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="Office / Studio / Residential Address"
              value={billing.billingAddress}
              onChange={(e) => setBilling({ ...billing, billingAddress: e.target.value })}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>City *</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="e.g. Mumbai, Delhi, Bengaluru"
              value={billing.city}
              onChange={(e) => setBilling({ ...billing, city: e.target.value })}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>State / Union Territory *</label>
            <select
              required
              className={styles.select}
              value={billing.state}
              onChange={(e) => handleStateChange(e.target.value)}
            >
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.name} (State Code: {s.code})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Pincode *</label>
            <input
              type="text"
              maxLength={6}
              required
              className={styles.input}
              placeholder="e.g. 400051"
              value={billing.pincode}
              onChange={(e) => setBilling({ ...billing, pincode: e.target.value })}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              PAN Number <span className={styles.optionalTag}>Optional</span>
            </label>
            <input
              type="text"
              maxLength={10}
              className={styles.input}
              placeholder="e.g. ABCDE1234F"
              value={billing.pan || ''}
              onChange={(e) => setBilling({ ...billing, pan: e.target.value.toUpperCase() })}
            />
          </div>

          <div className={styles.formFooter} style={{ gridColumn: 'span 2' }}>
            <div className={styles.itcNotice}>
              <HelpCircle size={14} />
              <span>
                {billing.gstin
                  ? `GSTIN verified! Invoices will be issued with B2B status under Place of Supply: ${billing.state} (${billing.stateCode}).`
                  : 'Leaving GSTIN empty will generate standard retail B2C consumer tax invoices.'}
              </span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
              Save Invoicing Details
            </button>
          </div>
        </form>
      </div>

      {/* 2. Invoices & Payment History Table */}
      <div className={styles.card} style={{ marginTop: '24px' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <FileText size={18} color="var(--color-primary, #ff007a)" />
            <span>Subscription Tax Invoices &amp; Receipts</span>
          </div>
          <span style={{ fontSize: '11px', color: '#888' }}>
            {invoices.length} Invoice{invoices.length === 1 ? '' : 's'} Available
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
            <div className="empty-state-icon">
              <CreditCard size={24} />
            </div>
            <div className="empty-state-title">No tax invoices yet</div>
            <div className="empty-state-text">
              When you upgrade to Pro (₹599) or Premium (₹1,299), your official GST Tax Invoices will be generated here automatically with downloadable PDFs.
            </div>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Plan &amp; Period</th>
                  <th style={{ textAlign: 'right' }}>Amount (Incl. 18% GST)</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className={styles.invNumber}>{inv.invoiceNumber}</span>
                    </td>
                    <td>{inv.invoiceDate}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{inv.items[0]?.description?.split('-')[0] || 'Pro Plan'}</div>
                      <div style={{ fontSize: '11px', color: '#777' }}>SAC: {inv.items[0]?.sacCode}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                      ₹{inv.totalAmount.toFixed(2)}
                    </td>
                    <td>
                      {inv.isB2B ? (
                        <span className={styles.badgeB2B}>B2B (ITC)</span>
                      ) : (
                        <span className={styles.badgeB2C}>B2C Retail</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.badgePaid}>
                        <CheckCircle2 size={11} /> PAID
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => setSelectedInvoice(inv)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={12} /> View Tax Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Invoice Modal */}
      <TaxInvoiceModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
