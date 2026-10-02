'use client';

import { useState, useTransition, useEffect } from 'react';
import { Calendar, RefreshCw, CheckCircle2, AlertCircle, Link as LinkIcon, ExternalLink, Trash2, HelpCircle, Shield, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  getCalendarSyncStatus,
  connectGoogleCalendar,
  syncGoogleCalendarNow,
  disconnectGoogleCalendar,
  type CalendarSyncConfig,
} from '@/lib/actions/calendar-sync';

interface GoogleCalendarSyncCardProps {
  onSyncComplete?: () => void;
}

export default function GoogleCalendarSyncCard({ onSyncComplete }: GoogleCalendarSyncCardProps) {
  const { success, error: showError } = useToast();
  const [syncConfig, setSyncConfig] = useState<CalendarSyncConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [icalInput, setIcalInput] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadStatus = async () => {
    try {
      const data = await getCalendarSyncStatus();
      setSyncConfig(data);
    } catch (err) {
      console.error('Failed to load calendar sync status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!icalInput.trim()) return;

    startTransition(async () => {
      try {
        const res = await connectGoogleCalendar(icalInput);
        success(res.message);
        setIcalInput('');
        await loadStatus();
        onSyncComplete?.();
      } catch (err: any) {
        showError(err.message || 'Failed to connect calendar');
      }
    });
  };

  const handleSyncNow = () => {
    startTransition(async () => {
      try {
        const res = await syncGoogleCalendarNow();
        success(`Synced! ${res.totalDatesBlocked} busy dates updated, ${res.datesFreed} freed.`);
        await loadStatus();
        onSyncComplete?.();
      } catch (err: any) {
        showError(err.message || 'Sync failed');
      }
    });
  };

  const handleDisconnect = () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? Synced dates will be removed from your blocked list.')) return;

    startTransition(async () => {
      try {
        await disconnectGoogleCalendar();
        success('Google Calendar disconnected');
        await loadStatus();
        onSyncComplete?.();
      } catch (err: any) {
        showError(err.message || 'Failed to disconnect');
      }
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px auto' }} />
        <p style={{ fontSize: '13px' }}>Checking Google Calendar sync...</p>
      </div>
    );
  }

  const isConnected = !!syncConfig?.isConnected;

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Two-Way Google Calendar Sync
              </h3>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 700 }}>
                2-WAY REALTIME
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
              Events and appointments on your personal calendar automatically block dates on BookMyArtist
            </p>
          </div>
        </div>

        {isConnected && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle2 size={13} /> Active & Synced ({syncConfig?.syncedDatesCount} dates blocked)
          </span>
        )}
      </div>

      {!isConnected ? (
        <div>
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="input"
                style={{ flex: 1, minWidth: '240px' }}
                placeholder="Paste your Secret address in iCal format (https://calendar.google.com/calendar/ical/.../basic.ics)"
                value={icalInput}
                onChange={(e) => setIcalInput(e.target.value)}
                disabled={isPending}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending || !icalInput.trim()}
                style={{ gap: '6px', whiteSpace: 'nowrap' }}
              >
                {isPending ? <RefreshCw size={14} className="spin" /> : <LinkIcon size={14} />}
                {isPending ? 'Syncing...' : 'Connect & Sync Calendar'}
              </button>
            </div>
          </form>

          {/* Quick Guide Toggle */}
          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 0',
              }}
            >
              <HelpCircle size={14} /> {showGuide ? 'Hide instructions' : 'How to find your Google Calendar Secret iCal Link (30 seconds)'}
            </button>

            {showGuide && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '16px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  fontSize: '12.5px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.6',
                }}
              >
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Open <strong>Google Calendar</strong> on your laptop/desktop (<a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>calendar.google.com</a>).</li>
                  <li>Click the gear icon ⚙️ in the top right ➔ <strong>Settings</strong>.</li>
                  <li>In the left sidebar, click on your main calendar under <strong>"Settings for my calendars"</strong>.</li>
                  <li>Scroll down to the <strong>"Integrate calendar"</strong> section.</li>
                  <li>Copy the link labeled <strong>"Secret address in iCal format"</strong> and paste it above.</li>
                </ol>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px' }}>
                  <Shield size={14} />
                  <span>Privacy protected: Titles of private events are strictly masked as "Engaged" on your public site.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--color-bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Google Calendar Feed Connected
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                {syncConfig.lastSyncedAt ? `Last synchronized: ${new Date(syncConfig.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${syncConfig.syncedDatesCount} dates blocked)` : 'Sync active'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSyncNow}
                disabled={isPending}
                style={{ gap: '6px', fontSize: '12px' }}
              >
                <RefreshCw size={13} className={isPending ? 'spin' : ''} /> Sync Now
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleDisconnect}
                disabled={isPending}
                style={{ color: 'var(--color-error)', gap: '4px', fontSize: '12px' }}
                title="Disconnect Google Calendar"
              >
                <Trash2 size={13} /> Disconnect
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            <Sparkles size={14} color="var(--color-primary)" />
            <span>Any dates added or updated in Google Calendar automatically protect your BookMyArtist portfolio from double bookings.</span>
          </div>
        </div>
      )}
    </div>
  );
}
