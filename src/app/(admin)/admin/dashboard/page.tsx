import {
  Users,
  TrendingUp,
  IndianRupee,
  CreditCard,
  UserCheck,
  ShieldCheck,
  Activity,
  Briefcase,
  Sparkles,
  CalendarCheck,
  ArrowUpRight,
  Eye,
  Video,
  Globe,
  Trophy,
  Inbox,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import {
  getAdminStats,
  getPlatformInquiryStats,
  getRecentPlatformActivities,
  getPlatformTrafficAnalytics,
} from '@/lib/actions/admin';
import { getContactInquiries, getContactInquiryStats } from '@/lib/actions/contact';
import { formatINR } from '@/lib/utils';
import { ExportLeadsButton } from './ExportLeadsButton';
import styles from './admin.module.css';

export default async function AdminDashboard() {
  const [stats, inquiryStats, activities, trafficAnalytics, contactInquiries, contactStats] = await Promise.all([
    getAdminStats(),
    getPlatformInquiryStats(),
    getRecentPlatformActivities(),
    getPlatformTrafficAnalytics(),
    getContactInquiries(),
    getContactInquiryStats(),
  ]);

  const statsCards = [
    { icon: Users, label: 'Total Anchors', value: stats.totalUsers.toString(), change: 'Registered profiles', color: 'var(--color-primary)' },
    { icon: UserCheck, label: 'Active Directory Profiles', value: stats.activeProfiles.toString(), change: 'Searchable by clients', color: 'var(--color-success)' },
    { icon: CreditCard, label: 'Paid Subscribers', value: stats.paidSubscribers.toString(), change: 'Starter/Pro/Premium', color: 'var(--color-accent)' },
    { icon: IndianRupee, label: 'Platform MRR', value: formatINR(stats.mrr), change: 'Monthly recurring revenue', color: 'var(--color-info)' },
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Overview</h1>
          <p className={styles.pageSubtitle}>Real-time platform health, revenue, anchor activity, and booking analytics</p>
        </div>
        <div className="badge badge-success" style={{ gap: '6px', padding: '6px 12px' }}>
          <ShieldCheck size={14} /> Live Supabase Connected
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className={styles.statsGrid}>
        {statsCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <s.icon size={18} color={s.color} />
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Platform ROI & Lead Pipeline Metrics */}
      <div style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <h3 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} color="var(--color-primary)" />
            <span>Anchor Business Generation (Platform ROI)</span>
          </h3>
          <ExportLeadsButton />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="stat-label">Total Booking Leads</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
              {inquiryStats.total}
            </div>
            <div className="text-secondary text-xs" style={{ marginTop: '4px' }}>
              {inquiryStats.recentInquiriesCount} inquiries in last 7 days
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="stat-label">Est. Anchor Deal Volume</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
              {formatINR(inquiryStats.estimatedDealVolume)}
            </div>
            <div className="text-secondary text-xs" style={{ marginTop: '4px' }}>
              Total booking value routed to anchors
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="stat-label">Lead Conversion Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)', marginTop: '4px' }}>
              {inquiryStats.conversionRate}%
            </div>
            <div className="text-secondary text-xs" style={{ marginTop: '4px' }}>
              {inquiryStats.convertedCount} confirmed anchor bookings
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="stat-label">Top Demand Cities</div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {inquiryStats.topCities.length > 0 ? (
                inquiryStats.topCities.map((c) => (
                  <span key={c.city} className="badge badge-ghost" style={{ fontSize: '11px' }}>
                    {c.city} ({c.count})
                  </span>
                ))
              ) : (
                <span className="text-tertiary text-xs">Awaiting client bookings</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Platform Traffic & Showreel Analytics (Live) */}
      <div style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <h3 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} color="var(--color-primary)" />
            <span>Platform Traffic & Showreel Engagement (Live)</span>
          </h3>
          <span className="badge badge-success" style={{ fontSize: '11px', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            Real-time Aggregation
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="stat-label">Total Platform Views</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
              {trafficAnalytics.totalPlatformViews.toLocaleString()}
            </div>
            <div className="text-secondary text-xs" style={{ marginTop: '4px' }}>
              Anchor portfolios viewed
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="stat-label">Showreels Played</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)', marginTop: '4px' }}>
              {trafficAnalytics.totalVideoPlays.toLocaleString()}
            </div>
            <div className="text-secondary text-xs" style={{ marginTop: '4px' }}>
              Performance video clicks
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="stat-label">WhatsApp & Call Clicks</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
              {(trafficAnalytics.totalWhatsAppClicks + trafficAnalytics.totalPhoneClicks).toLocaleString()}
            </div>
            <div className="text-secondary text-xs" style={{ marginTop: '4px' }}>
              Direct client click-to-contact
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="stat-label">Active Portfolios Visited</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
              {trafficAnalytics.topAnchors.length}
            </div>
            <div className="text-secondary text-xs" style={{ marginTop: '4px' }}>
              Anchors receiving visits
            </div>
          </div>
        </div>

        {/* Top Anchors Leaderboard & Visitor Geo Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          {/* Top Anchors Leaderboard */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={16} color="#F59E0B" /> Most Viewed Anchors (Leaderboard)
              </div>
            </div>
            {trafficAnalytics.topAnchors.length === 0 ? (
              <div className="text-tertiary text-xs" style={{ padding: '20px 0', textAlign: 'center' }}>
                Visitor views will populate anchor rankings here in real-time.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {trafficAnalytics.topAnchors.map((a, idx) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: idx === 0 ? '#F59E0B' : 'var(--color-text-tertiary)', width: '18px' }}>
                        #{idx + 1}
                      </span>
                      <a href={`/${a.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        {a.name}
                      </a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                      <span title="Profile Views" style={{ color: 'var(--color-primary)' }}>
                        👀 {a.views}
                      </span>
                      <span title="Showreel Plays" style={{ color: 'var(--color-accent)' }}>
                        🎬 {a.videoPlays}
                      </span>
                      <span title="Inquiries" style={{ color: '#10B981' }}>
                        📩 {a.inquiries}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visitor Geo Demand Distribution */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Globe size={16} color="var(--color-info)" /> Visitor Geographic Distribution
            </div>
            {trafficAnalytics.topVisitorCities.length === 0 ? (
              <div className="text-tertiary text-xs" style={{ padding: '20px 0', textAlign: 'center' }}>
                Visitor locations across India will appear here in real-time.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trafficAnalytics.topVisitorCities.map((c) => (
                  <div key={c.city} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: 500 }}>{c.city}</span>
                      <span className="text-tertiary">{c.count} visits ({c.percentage}%)</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(c.percentage, 5)}%`, height: '100%', background: 'var(--gradient-accent)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'var(--space-6)' }}>
        {/* Recent Registered Anchors */}
        <div className={styles.section} style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Recent Anchors</h3>
            <Link href="/admin/users" className="btn btn-ghost btn-xs">View All Users →</Link>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {stats.recentSignups.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                No users registered yet.
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>City</th>
                      <th>Portfolio</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSignups.slice(0, 6).map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.name || 'Anchor'}</strong></td>
                        <td>{u.city || '—'}</td>
                        <td>
                          <a href={`/${u.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontSize: '12px' }}>
                            /{u.slug}
                          </a>
                        </td>
                        <td className="text-tertiary text-xs">
                          {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Live Platform Activity Stream */}
        <div className={styles.section} style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} color="var(--color-accent)" />
              <span>Live Platform Activity</span>
            </h3>
            <span className="badge badge-success" style={{ fontSize: '10px' }}>Real-time</span>
          </div>

          <div className="card" style={{ padding: 'var(--space-3)' }}>
            {activities.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                No recent activity recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {act.type === 'signup' && <Users size={15} color="var(--color-primary)" />}
                      {act.type === 'upgrade' && <Sparkles size={15} color="#f59e0b" />}
                      {act.type === 'inquiry' && <CalendarCheck size={15} color="#10b981" />}
                      <span>{act.description}</span>
                    </div>
                    <span className="text-tertiary text-xs" style={{ whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {new Date(act.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Queries & Support Tickets Section */}
      <div className={styles.section} style={{ marginTop: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Inbox size={18} color="var(--color-primary)" />
            <span>Recent Contact Queries &amp; Support Inquiries</span>
            {contactStats.newCount > 0 && (
              <span className="badge badge-accent" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {contactStats.newCount} New
              </span>
            )}
          </h3>
          <Link href="/admin/inquiries" className="btn btn-ghost btn-xs">
            View All Queries ({contactStats.total}) →
          </Link>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)' }}>
          {contactInquiries.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
              No contact desk inquiries received yet. Inquiries from the Contact page will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contactInquiries.slice(0, 5).map((inq) => (
                <div
                  key={inq.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{inq.name}</strong>
                      <span className="badge badge-ghost" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {inq.subject}
                      </span>
                      {inq.status === 'new' && (
                        <span className="badge badge-accent" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          New
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      <a href={`mailto:${inq.email}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                        {inq.email}
                      </a>
                      {inq.phone ? ` · ${inq.phone}` : ''}
                      {' · '}
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        &ldquo;{inq.message.length > 80 ? `${inq.message.slice(0, 80)}...` : inq.message}&rdquo;
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="text-tertiary text-xs">
                      {new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <Link href="/admin/inquiries" className="btn btn-secondary btn-xs">
                      Reply →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Plan Distribution */}
      <div className={styles.section} style={{ marginTop: 'var(--space-6)' }}>
        <h3 className={styles.sectionTitle}>Plan Distribution</h3>
        <div className={styles.planBars}>
          {[
            { label: 'Free Tier', count: Math.max(0, stats.totalUsers - stats.paidSubscribers), pct: stats.totalUsers ? Math.round(((stats.totalUsers - stats.paidSubscribers) / stats.totalUsers) * 100) : 100, color: 'var(--color-text-tertiary)' },
            { label: 'Starter ₹199', count: 0, pct: 0, color: 'var(--color-primary)' },
            { label: 'Pro ₹599', count: 0, pct: 0, color: 'var(--color-accent)' },
            { label: 'Premium ₹1299', count: 0, pct: 0, color: 'var(--color-warning)' },
          ].map((p) => (
            <div key={p.label} className={styles.planBar}>
              <div className={styles.planBarLabel}>
                <span>{p.label}</span>
                <span>{p.pct}%</span>
              </div>
              <div className={styles.planBarTrack}>
                <div className={styles.planBarFill} style={{ width: `${p.pct}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
