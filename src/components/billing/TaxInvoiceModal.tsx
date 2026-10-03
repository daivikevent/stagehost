'use client';

import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Building,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import type { TaxInvoice } from '@/types/invoice';
import styles from './TaxInvoiceModal.module.css';

interface TaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: TaxInvoice | null;
}

export function TaxInvoiceModal({ isOpen, onClose, invoice }: TaxInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🧾 *BookMyArtist GST Tax Invoice: ${invoice.invoiceNumber}*\n` +
      `Plan: ${invoice.items[0]?.description || 'Subscription'}\n` +
      `Amount: ₹${invoice.totalAmount} (${invoice.amountInWords})\n` +
      `Date: ${invoice.invoiceDate}\n` +
      `Status: PAID (Razorpay ID: ${invoice.paymentDetails.paymentId})\n\n` +
      `Logged in as: ${invoice.customer.businessName || invoice.customer.name}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const isIntraState = invoice.totalCgst > 0 && invoice.totalSgst > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar (Hidden in Print) */}
        <div className={styles.topBar}>
          <div className={styles.topBarTitle}>
            <FileText size={16} color="var(--color-primary, #ff007a)" />
            <span>Tax Invoice — {invoice.invoiceNumber}</span>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={handleWhatsAppShare}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Share2 size={12} /> Share
            </button>
            <button
              type="button"
              className="btn btn-xs btn-primary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Printer size={12} /> Print / Save PDF
            </button>
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={onClose}
              style={{ padding: '4px 6px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className={styles.scrollArea}>
          <div className={styles.invoiceSheet} ref={invoiceRef}>
            {/* Header: Brand Logo & Title */}
            <div className={styles.brandHeader}>
              <div>
                <BrandLogo variant="quotation" />
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                  {invoice.supplier.tradeName} — Digital Stage &amp; Booking Management Platform
                </div>
              </div>
              <div className={styles.taxInvoiceBadge}>
                <h1 className={styles.taxTitle}>TAX INVOICE</h1>
                <span className={styles.originalPill}>ORIGINAL FOR RECIPIENT</span>
                {invoice.isB2B ? (
                  <span className={styles.b2bPill}>B2B (ITC ELIGIBLE)</span>
                ) : (
                  <span className={styles.b2bPill} style={{ background: '#f3f4f6', color: '#4b5563', borderColor: '#e5e7eb' }}>
                    B2C CONSUMER
                  </span>
                )}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className={styles.metaGrid}>
              <div>
                <div className={styles.metaItemLabel}>Invoice Number</div>
                <div className={styles.metaItemValue}>{invoice.invoiceNumber}</div>
              </div>
              <div>
                <div className={styles.metaItemLabel}>Invoice Date</div>
                <div className={styles.metaItemValue}>{invoice.invoiceDate}</div>
              </div>
              <div>
                <div className={styles.metaItemLabel}>Place of Supply</div>
                <div className={styles.metaItemValue}>{invoice.placeOfSupply}</div>
              </div>
            </div>

            {/* Parties: Supplier vs Customer */}
            <div className={styles.partiesGrid}>
              {/* Supplier (Biller) */}
              <div className={styles.partyCard}>
                <div className={styles.partyHeading}>Details of Supplier (Biller)</div>
                <div className={styles.partyName}>{invoice.supplier.legalName}</div>
                <div className={styles.partyText}>{invoice.supplier.address}, {invoice.supplier.city}</div>
                <div className={styles.partyText}>{invoice.supplier.state} — {invoice.supplier.pincode}</div>
                <div className={styles.partyText}>
                  <span className={styles.gstTag}>GSTIN:</span> {invoice.supplier.gstin}
                </div>
                <div className={styles.partyText}>
                  <span className={styles.gstTag}>PAN:</span> {invoice.supplier.pan} | <span className={styles.gstTag}>State Code:</span> {invoice.supplier.stateCode}
                </div>
                <div className={styles.partyText}>
                  <span className={styles.gstTag}>Email:</span> {invoice.supplier.email}
                </div>
              </div>

              {/* Customer (Recipient) */}
              <div className={styles.partyCard}>
                <div className={styles.partyHeading}>Details of Recipient (Billed To)</div>
                <div className={styles.partyName}>{invoice.customer.businessName || invoice.customer.name}</div>
                <div className={styles.partyText}>{invoice.customer.address}</div>
                <div className={styles.partyText}>{invoice.customer.city}, {invoice.customer.state} — {invoice.customer.pincode}</div>
                <div className={styles.partyText}>
                  <span className={styles.gstTag}>GSTIN:</span>{' '}
                  {invoice.customer.gstin ? (
                    <strong style={{ color: '#059669' }}>{invoice.customer.gstin}</strong>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Not Provided (Unregistered Consumer)</span>
                  )}
                </div>
                <div className={styles.partyText}>
                  <span className={styles.gstTag}>State Code:</span> {invoice.customer.stateCode} | <span className={styles.gstTag}>Email:</span> {invoice.customer.email}
                </div>
                {invoice.customer.phone && (
                  <div className={styles.partyText}>
                    <span className={styles.gstTag}>Contact:</span> +91 {invoice.customer.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>#</th>
                    <th>Description of Service</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>SAC</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>Taxable (₹)</th>
                    {isIntraState ? (
                      <>
                        <th style={{ width: '70px', textAlign: 'right' }}>CGST (9%)</th>
                        <th style={{ width: '70px', textAlign: 'right' }}>SGST (9%)</th>
                      </>
                    ) : (
                      <th style={{ width: '80px', textAlign: 'right' }}>IGST (18%)</th>
                    )}
                    <th style={{ width: '90px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className={styles.itemDescTitle}>{item.description}</div>
                        <div className={styles.itemDescSub}>Cloud Hosting &amp; Software Provisioning Services</div>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{item.sacCode}</td>
                      <td style={{ textAlign: 'right' }}>₹{item.taxableAmount.toFixed(2)}</td>
                      {isIntraState ? (
                        <>
                          <td style={{ textAlign: 'right' }}>₹{item.cgstAmount.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>₹{item.sgstAmount.toFixed(2)}</td>
                        </>
                      ) : (
                        <td style={{ textAlign: 'right' }}>₹{item.igstAmount.toFixed(2)}</td>
                      )}
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Words */}
            <div className={styles.summaryRow}>
              <div className={styles.wordsBox}>
                <div className={styles.wordsLabel}>Invoice Amount in Words</div>
                <div className={styles.wordsText}>{invoice.amountInWords}</div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#6b7280' }}>
                  Reverse Charge Applicable: <strong>NO</strong> | Currency: <strong>INR (₹)</strong>
                </div>
              </div>

              <table className={styles.totalsTable}>
                <tbody>
                  <tr>
                    <td>Total Taxable Value:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{invoice.subtotalTaxable.toFixed(2)}</td>
                  </tr>
                  {isIntraState ? (
                    <>
                      <tr>
                        <td>CGST (9%):</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{invoice.totalCgst.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>SGST (9%):</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{invoice.totalSgst.toFixed(2)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td>IGST (18%):</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{invoice.totalIgst.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className={styles.grandTotal}>
                    <td>Total Invoice Value:</td>
                    <td style={{ textAlign: 'right' }}>₹{invoice.totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment & Signatory Footer */}
            <div className={styles.footerGrid}>
              <div className={styles.paymentVerification}>
                <div className={styles.verifyTitle}>
                  <CheckCircle2 size={14} color="#16a34a" /> Electronic Payment Verified
                </div>
                <div className={styles.verifyText}>Payment Gateway: Razorpay Payments Ltd</div>
                <div className={styles.verifyText}>Transaction ID: <strong>{invoice.paymentDetails.paymentId}</strong></div>
                <div className={styles.verifyText}>Order Reference: {invoice.paymentDetails.orderId || 'Direct Charge'}</div>
                <div className={styles.verifyText}>Payment Status: <strong>PAID IN FULL</strong></div>
              </div>

              <div className={styles.signatoryBox}>
                <div className={styles.stampMark}>
                  <span>BOOKMYARTIST</span>
                  <span>DIGITALLY SIGNED</span>
                </div>
                <div className={styles.signatoryLabel}>For &amp; On Behalf Of</div>
                <div className={styles.signatoryCompany}>{invoice.supplier.legalName}</div>
                <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>Authorized Signatory</div>
              </div>
            </div>

            {/* Legal Notice */}
            <div className={styles.legalNotice}>
              This is a digitally signed and generated Tax Invoice pursuant to Section 31 of the Central Goods and Services Tax Act, 2017.
              All disputes are subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
