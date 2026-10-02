'use client';

import { useState, useTransition, useEffect } from 'react';
import { Globe, CheckCircle2, Clock, AlertCircle, RefreshCw, Trash2, ArrowUpRight, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  getArtistCustomDomain,
  connectCustomDomain,
  verifyCustomDomainDns,
  disconnectCustomDomain,
  type ArtistDomainInfo,
} from '@/lib/actions/domain';

interface CustomDomainCardProps {
  onUpgradeClick?: () => void;
}

export default function CustomDomainCard({ onUpgradeClick }: CustomDomainCardProps) {
  const { success, error: showError } = useToast();
  const [domainInfo, setDomainInfo] = useState<ArtistDomainInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainInput, setDomainInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadDomainInfo = async () => {
    try {
      const data = await getArtistCustomDomain();
      setDomainInfo(data);
      if (data.domain) {
        setDomainInput(data.domain);
      }
    } catch (err) {
      console.error('Failed to load custom domain info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomainInfo();
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    startTransition(async () => {
      try {
        await connectCustomDomain(domainInput);
        success(`Domain "${domainInput}" added! Add the CNAME record below in your domain DNS.`);
        await loadDomainInfo();
      } catch (err: any) {
        showError(err.message || 'Failed to connect domain');
      }
    });
  };

  const handleVerify = () => {
    startTransition(async () => {
      try {
        const res = await verifyCustomDomainDns();
        if (res.verified) {
          success(res.message);
        } else {
          showError(res.message);
        }
        await loadDomainInfo();
      } catch (err: any) {
        showError(err.message || 'Verification failed');
      }
    });
  };

  const handleDisconnect = () => {
    if (!confirm('Are you sure you want to disconnect this custom domain? Your profile will revert to the default URL.')) return;

    startTransition(async () => {
      try {
        await disconnectCustomDomain();
        success('Custom domain disconnected');
        setDomainInput('');
        await loadDomainInfo();
      } catch (err: any) {
        showError(err.message || 'Failed to disconnect');
      }
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ fontSize: '13px' }}>Loading custom domain settings...</p>
      </div>
    );
  }

  // If user cannot connect (Not on Premium plan)
  if (!domainInfo?.canConnect) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(23, 20, 48, 0.8) 0%, rgba(13, 11, 26, 0.95) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(212, 175, 55, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d4af37',
              flexShrink: 0,
            }}
          >
            <Globe size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                White-Label Custom Domain
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #d4af37, #f59e0b)',
                  color: '#000',
                  letterSpacing: '0.05em',
                }}
              >
                PREMIUM
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', maxWidth: '640px' }}>
              Brand your own custom domain (e.g., <strong>aaravsharma.com</strong> or <strong>priyasingh.live</strong>) with automated free SSL. Your clients will see your personal URL everywhere while BookMyArtist powers your booking calendar behind the scenes.
            </p>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Your Current Tier</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
              {domainInfo?.planTier || 'Free'} Plan
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Required Tier</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>
              Premium VIP (₹1,299/mo)
            </div>
          </div>
        </div>

        {onUpgradeClick && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onUpgradeClick}
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)',
              borderColor: '#d4af37',
              color: '#ffffff',
              fontWeight: 700,
              gap: '8px',
            }}
          >
            <Sparkles size={16} /> Upgrade to Premium & Connect Domain
          </button>
        )}
      </div>
    );
  }

  const isConnected = !!domainInfo.domain;
  const isActive = domainInfo.status === 'active';

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
              background: 'rgba(108, 92, 231, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <Globe size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Custom Domain White-Labeling
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
              Link your personal domain name to your BookMyArtist portfolio
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
              background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isActive ? '#10b981' : '#f59e0b',
              border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            }}
          >
            {isActive ? <CheckCircle2 size={13} /> : <Clock size={13} />}
            {isActive ? 'Active & Live' : 'DNS Propagation Pending'}
          </span>
        )}
      </div>

      {!isConnected ? (
        <form onSubmit={handleConnect} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input"
            style={{ flex: 1, minWidth: '220px' }}
            placeholder="e.g. rahulsharma.live or artist.mybrand.com"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            disabled={isPending}
            required
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending || !domainInput.trim()}
            style={{ gap: '6px', whiteSpace: 'nowrap' }}
          >
            {isPending ? <RefreshCw size={14} className="spin" /> : <Globe size={14} />}
            {isPending ? 'Connecting...' : 'Connect Domain'}
          </button>
        </form>
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
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={16} color="var(--color-primary)" />
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                https://{domainInfo.domain}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <a
                href={`https://${domainInfo.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ gap: '4px', fontSize: '12px' }}
              >
                <ExternalLink size={13} /> Visit
              </a>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleVerify}
                disabled={isPending}
                style={{ gap: '6px', fontSize: '12px' }}
              >
                <RefreshCw size={13} className={isPending ? 'spin' : ''} /> Verify DNS
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleDisconnect}
                disabled={isPending}
                style={{ color: 'var(--color-error)', gap: '4px', fontSize: '12px' }}
                title="Disconnect Domain"
              >
                <Trash2 size={13} /> Disconnect
              </button>
            </div>
          </div>

          {/* DNS Configuration Instructions Table */}
          <div
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              padding: '16px',
            }}
          >
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              DNS Records Setup Instructions
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
              Go to your domain provider (GoDaddy, Hostinger, Cloudflare, Namecheap) and add this CNAME record:
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                    <th style={{ padding: '6px 8px' }}>Type</th>
                    <th style={{ padding: '6px 8px' }}>Name / Host</th>
                    <th style={{ padding: '6px 8px' }}>Value / Target</th>
                    <th style={{ padding: '6px 8px' }}>TTL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--color-primary)' }}>CNAME</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>@ (or {domainInfo.domain?.split('.')[0] || 'subdomain'})</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', color: '#10b981' }}>{domainInfo.dnsTarget}</td>
                    <td style={{ padding: '8px' }}>Auto / 3600</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--color-text-tertiary)' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>Free SSL certificate is provisioned automatically once CNAME propagates.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
