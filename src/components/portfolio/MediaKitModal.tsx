'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  FileText,
  Printer,
  Copy,
  Check,
  X,
  MapPin,
  Clock,
  Phone,
  Mail,
  Star,
  Globe,
  Sparkles,
  Award,
} from 'lucide-react';
import type { AnchorProfile } from '@/types';
import { formatINR } from '@/lib/utils';
import styles from './MediaKitModal.module.css';

interface MediaKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AnchorProfile;
}

export function MediaKitModal({ isOpen, onClose, profile }: MediaKitModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedText, setCopiedText] = useState(false);

  const cleanSlug = profile.slug || 'anchor';
  const liveBrandUrl = `https://stagehost.in/${cleanSlug}`;

  useEffect(() => {
    if (!isOpen || !cleanSlug) return;

    QRCode.toDataURL(liveBrandUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR for media kit:', err));
  }, [isOpen, cleanSlug, liveBrandUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    const rateCardText = `🎤 *${profile.name.toUpperCase()}* — Profile & Rate Sheet
${profile.tagline ? `_${profile.tagline}_\n` : ''}
📍 *Base City:* ${profile.city || 'India'}
⭐ *Experience:* ${profile.experience_years || 5}+ Years
🗣️ *Languages:* ${profile.languages?.join(', ') || 'Hindi, English'}
🎯 *Specializations:* ${profile.event_types?.join(', ') || 'Weddings, Corporate, Concerts'}

💰 *Commercials / Investment:*
${
  profile.service_packages && profile.service_packages.length > 0
    ? profile.service_packages
        .map(
          (pkg) =>
            `• ${pkg.name}: ${pkg.price_range_min ? formatINR(pkg.price_range_min) : 'On Request'}`
        )
        .join('\n')
    : `• Starting Investment: ${profile.starting_price ? formatINR(profile.starting_price) : 'On Request'}`
}

🎬 *Watch Live Showreels & Check Tour Dates:*
👉 ${liveBrandUrl}

📞 *Direct Booking Inquiry:*
WhatsApp / Call: +91 ${profile.whatsapp_number || profile.phone || ''}
Email: ${profile.email || ''}`;

    try {
      await navigator.clipboard.writeText(rateCardText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            <FileText size={18} color="var(--color-primary)" />
            <span>PDF Media Kit & Rate Card</span>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyText}
              style={{ gap: '6px' }}
            >
              {copiedText ? <Check size={14} /> : <Copy size={14} />}
              {copiedText ? 'Copied Text!' : 'Copy WhatsApp Rate Sheet'}
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ gap: '6px' }}
            >
              <Printer size={14} />
              Print / Save as PDF
            </button>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview */}
        <div className={styles.scrollArea}>
          <div className={styles.paper} id="media-kit-printable">
            {/* Document Header */}
            <div className={styles.docHeader}>
              <div>
                <h1 className={styles.docTitleName}>{profile.name}</h1>
                <div className={styles.docTagline}>
                  {profile.tagline || 'Celebrity Anchor & Professional Emcee'}
                </div>

                <div className={styles.docMetaRow}>
                  {profile.city && (
                    <div className={styles.docMetaItem}>
                      <MapPin size={13} color="#6C5CE7" />
                      <span>{profile.city}, India</span>
                    </div>
                  )}
                  {profile.experience_years && (
                    <div className={styles.docMetaItem}>
                      <Clock size={13} color="#6C5CE7" />
                      <span>{profile.experience_years}+ Years Experience</span>
                    </div>
                  )}
                  {(profile.gigs_completed || profile.experience_years) && (
                    <div className={styles.docMetaItem}>
                      <Award size={13} color="#6C5CE7" />
                      <span>{profile.gigs_completed ? `${profile.gigs_completed}+` : `${(profile.experience_years || 5) * 50}+`} Stage Shows</span>
                    </div>
                  )}
                  {profile.starting_price && (
                    <div className={styles.docMetaItem}>
                      <Sparkles size={13} color="#10B981" />
                      <span>Starting at {formatINR(profile.starting_price)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div className={styles.docQrBox}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Scan QR" className={styles.docQrImg} />
                ) : (
                  <div style={{ width: 90, height: 90, background: '#e2e8f0' }} />
                )}
                <span className={styles.docQrCaption}>Scan for Videos</span>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className={styles.docSection}>
                <h3 className={styles.docSectionTitle}>About & Hosting Style</h3>
                <p className={styles.docBio}>{profile.bio}</p>
              </div>
            )}

            {/* Specializations & Languages */}
            <div className={styles.docSection} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h3 className={styles.docSectionTitle}>Event Specializations</h3>
                <div className={styles.docPillList}>
                  {profile.event_types && profile.event_types.length > 0
                    ? profile.event_types.map((type) => (
                        <span key={type} className={styles.docPill}>
                          {type}
                        </span>
                      ))
                    : ['Weddings', 'Corporate Events', 'Sangeet', 'Concerts'].map((type) => (
                        <span key={type} className={styles.docPill}>
                          {type}
                        </span>
                      ))}
                </div>
              </div>

              <div>
                <h3 className={styles.docSectionTitle}>Languages Spoken</h3>
                <div className={styles.docPillList}>
                  {profile.languages && profile.languages.length > 0
                    ? profile.languages.map((lang) => (
                        <span key={lang} className={styles.docPill}>
                          {lang}
                        </span>
                      ))
                    : ['Hindi', 'English'].map((lang) => (
                        <span key={lang} className={styles.docPill}>
                          {lang}
                        </span>
                      ))}
                </div>
              </div>
            </div>

            {/* Services & Commercials Rate Sheet */}
            <div className={styles.docSection}>
              <h3 className={styles.docSectionTitle}>Services & Investment Breakdown</h3>
              <table className={styles.docTable}>
                <thead>
                  <tr>
                    <th>Service Package</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Standard Investment</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.service_packages && profile.service_packages.length > 0 ? (
                    profile.service_packages.map((pkg) => (
                      <tr key={pkg.id}>
                        <td>
                          <strong>{pkg.name}</strong>
                          {pkg.description && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{pkg.description}</div>
                          )}
                        </td>
                        <td>{pkg.event_type || 'General'}</td>
                        <td style={{ textAlign: 'right' }} className={styles.docTablePrice}>
                          {pkg.price_range_min
                            ? pkg.price_range_max
                              ? `${formatINR(pkg.price_range_min)} – ${formatINR(pkg.price_range_max)}`
                              : formatINR(pkg.price_range_min)
                            : 'Commercials on Request'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td>
                        <strong>Grand Hosting (Wedding / Corporate Gala)</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Full show hosting, audience interaction & stage coordination
                        </div>
                      </td>
                      <td>General</td>
                      <td style={{ textAlign: 'right' }} className={styles.docTablePrice}>
                        {profile.starting_price ? formatINR(profile.starting_price) : 'On Request'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Verified Client Reviews */}
            {profile.testimonials && profile.testimonials.filter((t) => t.is_visible).length > 0 && (
              <div className={styles.docSection}>
                <h3 className={styles.docSectionTitle}>Client Praise & Endorsements</h3>
                <div className={styles.docReviewGrid}>
                  {profile.testimonials
                    .filter((t) => t.is_visible)
                    .slice(0, 2)
                    .map((t) => (
                      <div key={t.id} className={styles.docReviewCard}>
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                          {[...Array(t.rating || 5)].map((_, i) => (
                            <Star key={i} size={11} fill="#F59E0B" color="#F59E0B" />
                          ))}
                        </div>
                        <p className={styles.docReviewQuote}>&ldquo;{t.text}&rdquo;</p>
                        <div className={styles.docReviewAuthor}>
                          {t.client_name}
                          {t.client_designation && (
                            <span style={{ fontWeight: 400, color: '#64748b' }}>
                              {' '}
                              · {t.client_designation}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className={styles.docFooter}>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Direct Bookings & Inquiries</div>
                <div style={{ marginTop: '2px' }}>
                  WhatsApp: +91 {profile.whatsapp_number || profile.phone || 'Contact for bookings'}
                  {profile.email && ` | Email: ${profile.email}`}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className={styles.docFooterBrand}>StageHost Verified Media Kit</span>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{liveBrandUrl}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
