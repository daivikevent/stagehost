'use client';

import { useState } from 'react';
import {
  Calendar,
  Download,
  Copy,
  Check,
  X,
  Smartphone,
  Laptop,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import GoogleCalendarSyncCard from '@/components/dashboard/GoogleCalendarSyncCard';

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
  const [activeTab, setActiveTab] = useState<'twoway' | 'export'>('twoway');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bookmyartist.in';
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
        zIndex: 9999,
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
          maxWidth: '580px',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(108, 92, 231, 0.25)',
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <span>Calendar Synchronization Hub</span>
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

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '4px 16px 0 16px',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('twoway')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'twoway' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'twoway' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            <RefreshCw size={14} color={activeTab === 'twoway' ? 'var(--color-primary)' : 'currentColor'} />
            <span>2-Way Google Calendar Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'export' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'export' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            <Smartphone size={14} color={activeTab === 'export' ? '#10b981' : 'currentColor'} />
            <span>Export to iPhone / Outlook</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === 'twoway' ? (
            <div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Connect your personal Google Calendar to automatically block busy dates on BookMyArtist, protecting your schedule from double-bookings.
              </p>
              <GoogleCalendarSyncCard onSyncComplete={() => {}} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Export all confirmed shows and tour slots of <strong>{anchorName}</strong> into your phone or desktop calendar.
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
                  Add as a subscribed calendar in Apple Calendar or Google Calendar to receive new bookings automatically!
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
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
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
