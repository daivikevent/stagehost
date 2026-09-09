'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, Share2, Sparkles, MessageCircle } from 'lucide-react';
import { LinkedinIcon as Linkedin, TwitterIcon as Twitter } from '@/components/ui/SocialIcons';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  name: string;
  tagline?: string;
}

export function ShareModal({ isOpen, onClose, slug, name, tagline }: ShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://stagehost.in';
  const profileUrl = origin.includes('localhost') || origin.includes('127.0.0.1')
    ? `https://stagehost.in/${slug}`
    : `${origin}/${slug}`;

  // Generate QR Code data URL when modal opens
  useEffect(() => {
    if (!isOpen || !slug) return;

    QRCode.toDataURL(profileUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [isOpen, slug, profileUrl]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${slug}-stagehost-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Pre-crafted WhatsApp message
  const whatsappMessage = encodeURIComponent(
    `Namaste! 🙏\n\nCheck out my official hosting portfolio, performance videos & live tour availability here:\n👉 ${profileUrl}\n\nBookings open for Weddings, Corporate Events, Sangeet & College Fests! 🎤✨`
  );

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            <Share2 size={18} color="var(--color-primary)" />
            <span>Share Your Stage</span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* QR Code Card */}
          <div className={styles.qrContainer}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`${name} StageHost QR Code`}
                className={styles.qrImage}
              />
            ) : (
              <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="text-xs text-secondary">Generating QR...</span>
              </div>
            )}
            <div className={styles.qrBadge}>
              <Sparkles size={13} color="#6C5CE7" />
              <span>Scan to view stage</span>
            </div>
          </div>

          {/* Profile Name & Tagline */}
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{name}</div>
            <div className={styles.profileUrl}>{profileUrl}</div>
          </div>

          {/* URL Copy Bar */}
          <div className={styles.urlCopyBar}>
            <input
              type="text"
              readOnly
              value={profileUrl}
              className={styles.urlInput}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCopy}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </button>
          </div>

          {/* Action Grid (WhatsApp + Download) */}
          <div className={styles.actionGrid}>
            <a
              href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
            >
              <MessageCircle size={16} />
              Share on WhatsApp
            </a>

            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownloadQR}
            >
              <Download size={16} />
              Download QR (PNG)
            </button>
          </div>

          {/* Social Links Row */}
          <div className={styles.socialRow}>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              <Linkedin size={13} /> LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${name}'s official hosting portfolio on StageHost:`)}&url=${encodeURIComponent(profileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              <Twitter size={13} /> Twitter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
