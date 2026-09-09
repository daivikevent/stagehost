'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Video,
  MessageSquare,
  Phone,
  BarChart3,
  MapPin,
  Sparkles,
  Share2,
  Loader2,
  ExternalLink,
  Activity,
  Smartphone,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';
import { getAnchorAnalytics, type AnalyticsStatsResponse } from '@/lib/actions/analytics';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const loadAnalytics = (selectedDays: number) => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const res = await getAnchorAnalytics(selectedDays);
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    });
  };

  useEffect(() => {
    loadAnalytics(days);
  }, [days]);

  const maxViews = data?.monthlyViews && data.monthlyViews.length > 0
    ? Math.max(...data.monthlyViews.map((m) => m.views), 1)
    : 1;

  const stats = [
    {
      icon: Eye,
      label: 'Profile Views',
      value: (data?.totalViews ?? 0).toLocaleString(),
      change: `${(data?.viewsChange ?? 0) >= 0 ? '+' : ''}${data?.viewsChange ?? 0}%`,
      changeType: (data?.viewsChange ?? 0) >= 0 ? 'up' : 'down',
      sublabel: `in last ${days} days`,
      color: 'var(--color-primary)',
    },
    {
      icon: Video,
      label: 'Video Clicks',
      value: (data?.totalVideoClicks ?? 0).toLocaleString(),
      change: `${(data?.videoClicksChange ?? 0) >= 0 ? '+' : ''}${data?.videoClicksChange ?? 0}%`,
      changeType: (data?.videoClicksChange ?? 0) >= 0 ? 'up' : 'down',
      sublabel: 'showreel plays',
      color: 'var(--color-accent)',
    },
    {
      icon: MessageSquare,
      label: 'Inquiries',
      value: (data?.totalInquiries ?? 0).toLocaleString(),
      change: `${(data?.inquiriesChange ?? 0) >= 0 ? '+' : ''}${data?.inquiriesChange ?? 0}%`,
      changeType: (data?.inquiriesChange ?? 0) >= 0 ? 'up' : 'down',
      sublabel: 'direct client leads',
      color: '#10B981',
    },
    {
      icon: Phone,
      label: 'WhatsApp / Call Clicks',
      value: (data?.totalWhatsAppClicks ?? 0).toLocaleString(),
      change: `${(data?.whatsAppClicksChange ?? 0) >= 0 ? '+' : ''}${data?.whatsAppClicksChange ?? 0}%`,
      changeType: (data?.whatsAppClicksChange ?? 0) >= 0 ? 'up' : 'down',
      sublabel: 'direct intent contacts',
      color: '#F59E0B',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className={styles.pageTitle}>Analytics</h1>
            <span
              className="badge badge-success"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                padding: '3px 8px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              Live Tracking Active
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            Real-time portfolio performance, visitor traffic, and client engagement
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isPending && <Loader2 size={16} className="spinner" style={{ color: 'var(--color-primary)' }} />}
          <select
            className="input"
            style={{ width: 'auto', minWidth: '150px' }}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            disabled={isLoading}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Zero State / Onboarding Banner if 0 views */}
      {data && data.totalViews === 0 && !isLoading && (
        <div
          className="card"
          style={{
            padding: '20px',
            marginBottom: 'var(--space-6)',
            background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.12), rgba(0, 206, 201, 0.08))',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <span>Real-Time Visitor Tracking is Ready!</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
              Share your verified portfolio link on Instagram bio, WhatsApp status, or with event planners to see live visitor graphs and showreel clicks.
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <Share2 size={14} /> Share My Portfolio
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="flex items-center justify-between">
              <span className="stat-label">{stat.label}</span>
              <stat.icon size={18} color={stat.color} />
            </div>
            <div className="stat-value" style={{ marginTop: '6px' }}>
              {isLoading ? '...' : stat.value}
            </div>
            <div
              className={`stat-change stat-change-${stat.changeType}`}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '12px' }}
            >
              {stat.changeType === 'up' ? (
                <TrendingUp size={13} color="var(--color-success)" />
              ) : (
                <TrendingDown size={13} color="var(--color-danger)" />
              )}
              <span>{stat.change} vs prior period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className={styles.chartsGrid}>
        {/* Profile Views Timeline */}
        <div className={styles.chartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 className={styles.chartTitle} style={{ margin: 0 }}>
              <BarChart3 size={18} color="var(--color-primary)" />
              <span>Profile Views ({days <= 30 ? 'Daily' : 'Monthly'})</span>
            </h3>
            <span className="text-secondary text-xs">
              Total: {data?.totalViews ?? 0}
            </span>
          </div>

          {isLoading ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={24} className="spinner" color="var(--color-primary)" />
            </div>
          ) : data?.monthlyViews && data.monthlyViews.length > 0 ? (
            <div className={styles.barChart}>
              {data.monthlyViews.map((item) => {
                const heightPct = maxViews > 0 ? Math.max(4, Math.round((item.views / maxViews) * 100)) : 4;
                return (
                  <div key={item.month} className={styles.barItem} title={`${item.views} view(s)`}>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{
                          height: `${heightPct}%`,
                          background: item.views > 0 ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.06)',
                        }}
                      />
                    </div>
                    <span className={styles.barLabel} style={{ fontSize: days <= 14 ? '11px' : '10px' }}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
              No views logged in this timeframe yet.
            </div>
          )}
        </div>

        {/* Top Cities */}
        <div className={styles.chartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 className={styles.chartTitle} style={{ margin: 0 }}>
              <MapPin size={18} color="var(--color-accent)" />
              <span>Visitors by City</span>
            </h3>
            {data?.deviceBreakdown && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Smartphone size={12} /> {data.deviceBreakdown.mobile}
                </span>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Monitor size={12} /> {data.deviceBreakdown.desktop}
                </span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={24} className="spinner" color="var(--color-accent)" />
            </div>
          ) : data?.topCities && data.topCities.length > 0 ? (
            <div className={styles.cityList}>
              {data.topCities.map((item) => (
                <div key={item.city} className={styles.cityItem}>
                  <div className={styles.cityInfo}>
                    <span className={styles.cityName}>{item.city}</span>
                    <span className={styles.cityViews}>
                      {item.views} view{item.views > 1 ? 's' : ''} ({item.percentage}%)
                    </span>
                  </div>
                  <div className={styles.cityBar}>
                    <div
                      className={styles.cityBarFill}
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
              Awaiting first geo-tagged visitor.
            </div>
          )}
        </div>
      </div>

      {/* Top Videos Table */}
      <div className={styles.chartCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 className={styles.chartTitle} style={{ margin: 0 }}>
            <Video size={18} color="var(--color-primary)" />
            <span>Showreel & Video Engagement</span>
          </h3>
          <Link href="/portfolio" className="btn btn-ghost btn-xs" style={{ gap: '4px' }}>
            Manage Videos <ExternalLink size={12} />
          </Link>
        </div>

        {isLoading ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <Loader2 size={24} className="spinner" color="var(--color-primary)" />
          </div>
        ) : data?.topVideos && data.topVideos.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Video Title</th>
                  <th>Estimated Reach</th>
                  <th>Actual Plays</th>
                  <th>Play Rate (CTR)</th>
                </tr>
              </thead>
              <tbody>
                {data.topVideos.map((video) => (
                  <tr key={video.id}>
                    <td>
                      <span className={styles.videoTitle} style={{ fontWeight: 600 }}>
                        {video.title}
                      </span>
                    </td>
                    <td>{video.views}</td>
                    <td style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                      {video.clicks} play{video.clicks !== 1 ? 's' : ''}
                    </td>
                    <td>
                      <span
                        className="badge badge-ghost"
                        style={{
                          fontSize: '11px',
                          color: video.clicks > 0 ? 'var(--color-success)' : undefined,
                        }}
                      >
                        {video.ctr}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            <Video size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div>No showreels added yet.</div>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Add YouTube or Instagram video links to your portfolio to track play rates.
            </p>
            <div style={{ marginTop: '12px' }}>
              <Link href="/portfolio" className="btn btn-secondary btn-sm">
                Add Showreel
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Live Recent Visitor Events Feed */}
      {data?.recentEvents && data.recentEvents.length > 0 && (
        <div className={styles.chartCard} style={{ marginTop: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
            <Activity size={18} color="#10B981" />
            <h3 className={styles.chartTitle} style={{ margin: 0 }}>
              Recent Visitor Stream (Live)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.recentEvents.map((ev) => {
              const label =
                ev.event_type === 'profile_view'
                  ? '👀 Portfolio Page Visit'
                  : ev.event_type === 'video_click'
                  ? `🎬 Watched Showreel "${(ev.metadata as any)?.title || 'Video'}"`
                  : ev.event_type === 'whatsapp_click'
                  ? '💬 Clicked WhatsApp Chat'
                  : ev.event_type === 'phone_click'
                  ? '📞 Clicked Direct Call'
                  : ev.event_type === 'inquiry_submit'
                  ? `📩 Submitted Booking Inquiry (${(ev.metadata as any)?.event_type || 'Event'})`
                  : ev.event_type;

              const timeStr = new Date(ev.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const dateStr = new Date(ev.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });

              return (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{label}</span>
                    {ev.ip_city && (
                      <span className="badge badge-ghost" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        📍 {ev.ip_city}
                      </span>
                    )}
                  </div>
                  <span className="text-tertiary text-xs">
                    {dateStr} · {timeStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
