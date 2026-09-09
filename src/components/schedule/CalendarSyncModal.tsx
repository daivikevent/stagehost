'use client';

import { useState } from 'react';
import {
  Calendar,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Smartphone,
  Laptop,
  CheckCircle2,
} from 'lucide-react';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  anchorName: string;
}

export function CalendarSyncModal({
  isOpen,
  onClose,
  slug,
  anchorName,
}: CalendarSyncModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://stagehost.in';
  const icsUrl = `${origin}/api/calendar/${slug}`;
  const webcalUrl = icsUrl.replace(/^https?:\/\//, 'webcal://');

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy calendar URL:', err);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(108, 92, 231, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <span>Sync Tour Schedule to Phone & Calendar</span>
          </div>

          <button
            type="button"
            onClick={onClose}
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

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
            Export all confirmed shows, wedding dates, and tour slots of <strong>{anchorName}</strong> directly into your iPhone, Google Calendar, or MacBook!
          </p>

          {/* Option 1: 1-Click .ICS File Download */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Smartphone size={16} color="#6C5CE7" />
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                Option 1: 1-Click .ICS Calendar Download
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '0 0 12px 0' }}>
              Works instantly with Apple Calendar, Outlook, and Google Calendar on mobile & desktop.
            </p>

            <a
              href={`/api/calendar/${slug}`}
              download={`${slug}-schedule.ics`}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', textDecoration: 'none', display: 'inline-flex' }}
            >
              <Download size={14} />
              Download .ICS Calendar File
            </a>
          </div>

          {/* Option 2: Live Sync Feed URL */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Laptop size={16} color="#10B981" />
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                Option 2: Live iCal Feed URL (Auto-Sync)
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '0 0 10px 0' }}>
              Add as a subscribed calendar in Google Calendar (via &ldquo;From URL&rdquo;) or iPhone Calendar to stay automatically updated when you add new bookings!
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                readOnly
                value={icsUrl}
                style={{
                  flex: 1,
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 10px',
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'monospace',
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyUrl}
                style={{ gap: '4px', whiteSpace: 'nowrap' }}
              >
                {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Feed URL'}
              </button>
            </div>

            {/* 1-Click Direct Integration Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-xs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  padding: '7px 10px',
                  background: 'linear-gradient(135deg, #4285F4, #1A73E8)',
                  border: 'none',
                }}
              >
                <Calendar size={13} />
                <span>Subscribe in Google Cal</span>
              </a>

              <a
                href={webcalUrl}
                className="btn btn-secondary btn-xs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  padding: '7px 10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Smartphone size={13} />
                <span>Apple Calendar / iPhone</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
