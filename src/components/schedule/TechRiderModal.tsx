'use client';

import { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  Check,
  Sliders,
  Mic,
  Volume2,
  Zap,
  Clock,
  Sparkles,
  MapPin,
  ShieldCheck,
  Disc,
} from 'lucide-react';

export interface TechRiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistProfile: {
    name: string;
    tagline?: string | null;
    whatsapp_number?: string | null;
    artist_type?: string | null;
    slug?: string | null;
  };
}

export function TechRiderModal({ isOpen, onClose, artistProfile }: TechRiderModalProps) {
  const [copied, setCopied] = useState(false);
  const [eventName, setEventName] = useState('Upcoming Show / Gala');
  const [venue, setVenue] = useState('Main Ballroom Stage');
  const [soundcheckTime, setSoundcheckTime] = useState('60 Minutes Prior to Guest Arrival');
  const [soundEngineerContact, setSoundEngineerContact] = useState('');

  // Rider Specs
  const [micType, setMicType] = useState('2x Shure Beta 58A UHF Wireless Handhelds (Fresh 9V/AA Batteries)');
  const [monitorType, setMonitorType] = useState('2x 15" Active Wedge Monitors (L/R Stage Front) + Clean Aux Mix');
  const [consoleGear, setConsoleGear] = useState('Stereo DI Box for Backing Tracks / Pioneer DJ Console / Balanced XLR Outputs');
  const [stagePower, setStagePower] = useState('2x 230V 16A Grounded Noise-Free Power Points on Stage Center');
  const [hospitalityNotes, setHospitalityNotes] = useState('Air-conditioned Green Room with Mirror, Safe Storage & Mineral Water');

  if (!isOpen) return null;

  const riderNo = `BMA-RIDER-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  const whatsappRiderText = `🎛️ *STAGE SOUNDCHECK & TECHNICAL RIDER*
Ref: *${riderNo}*

🎤 *Performer / Artist:* ${artistProfile.name.toUpperCase()}
${artistProfile.tagline ? `_${artistProfile.tagline}_\n` : ''}📍 *Venue & Stage:* ${venue} (${eventName})
⏰ *Mandatory Soundcheck:* ${soundcheckTime}
${soundEngineerContact ? `🎧 *Sound Engineer / Vendor Contact:* ${soundEngineerContact}\n` : ''}
───────────────
🔊 *AUDIO & MICROPHONE REQUIREMENTS:*
• *Vocal Mics:* ${micType}
• *Stage Monitoring:* ${monitorType}
• *Inputs / Console:* ${consoleGear}
• *Stage Power:* ${stagePower}

🏨 *HOSPITALITY & GREEN ROOM:*
• ${hospitalityNotes}

⚠️ *SOUND PROTOCOL:*
1. Line check & mic frequency scan must be completed *before* ballroom doors open.
2. Direct dry vocal signal with subtle hall reverb. No harsh distortion or feedback.
3. Dedicated sound technician on console during the entire performance duration.

───────────────
🌐 *Artist Profile:* https://bookmyartist.in/${artistProfile.slug || ''}
_Generated via BookMyArtist Tech Rider Studio_`;

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(whatsappRiderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappRiderText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 5, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          background: '#121220',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(108, 92, 231, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Sliders size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Stage Soundcheck &amp; Tech Rider Studio
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: '2px 0 0' }}>
                Generate a 1-page sound engineer checklist to eliminate stage audio chaos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, marginBottom: '6px' }}>
                Event / Show Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, marginBottom: '6px' }}>
                Venue / Stage Location
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, marginBottom: '6px' }}>
                Soundcheck Time Call
              </label>
              <input
                type="text"
                value={soundcheckTime}
                onChange={(e) => setSoundcheckTime(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, marginBottom: '6px' }}>
                Sound Engineer / Audio Vendor Contact
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sound (98200xxxxx)"
                value={soundEngineerContact}
                onChange={(e) => setSoundEngineerContact(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Technical Specifications */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={16} /> Audio &amp; Stage Gear Checklist
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                  Microphone Specification
                </label>
                <input
                  type="text"
                  value={micType}
                  onChange={(e) => setMicType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                  Stage Monitoring (In-Ear / Wedges)
                </label>
                <input
                  type="text"
                  value={monitorType}
                  onChange={(e) => setMonitorType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                  Console, Mixer Inputs &amp; DJ Gear
                </label>
                <input
                  type="text"
                  value={consoleGear}
                  onChange={(e) => setConsoleGear(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                  Stage Power &amp; Line Conditions
                </label>
                <input
                  type="text"
                  value={stagePower}
                  onChange={(e) => setStagePower(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Ref: {riderNo}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyText}
              style={{
                padding: '9px 16px',
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
              {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
              {copied ? 'Copied Rider!' : 'Copy Rider Text'}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                background: '#25D366',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
              }}
            >
              <Share2 size={14} />
              Share on WhatsApp 📲
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
