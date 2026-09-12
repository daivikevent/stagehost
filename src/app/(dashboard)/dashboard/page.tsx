import {
  Eye,
  MessageSquare,
  Calendar,
  TrendingUp,
  Video,
  Image as ImageIcon,
  Package,
  Star,
  ArrowRight,
  Plus,
  ArrowUpRight,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';
import { getMyProfile } from '@/lib/actions/profile';
import { getInquiryCounts, getMyInquiries } from '@/lib/actions/inquiries';
import { getUpcomingEvents, getScheduleData } from '@/lib/actions/schedule';
import { getWhatsAppLink, cn } from '@/lib/utils';
import styles from './dashboard.module.css';
import { DashboardShareButton } from '@/components/dashboard/DashboardShareButton';
import { DashboardMediaKitButton } from '@/components/dashboard/DashboardMediaKitButton';

function formatEventDate(dateStr: string) {
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const monthName = date.toLocaleString('en-US', { month: 'short' });
    return { month: monthName, day: String(Number(day)) };
  } catch {
    return { month: 'DATE', day: '•' };
  }
}

export default async function DashboardPage() {
  // Fetch all dashboard data concurrently
  const [profile, inquiryCounts, upcomingEvents, inquiries, scheduleData] = await Promise.all([
    getMyProfile(),
    getInquiryCounts(),
    getUpcomingEvents(4),
    getMyInquiries(),
    getScheduleData(),
  ]);

  const firstName = profile?.name?.split(' ')[0] || 'there';
  const videoCount = profile?.videos?.length ?? 0;
  const serviceCount = profile?.service_packages?.length ?? 0;

  // Calculate profile completion score (0-100)
  const scoreFields = [
    !!profile?.name,
    !!profile?.bio,
    !!profile?.profile_photo_url,
    !!profile?.city,
    !!profile?.languages?.length,
    !!profile?.event_types?.length,
    serviceCount > 0,
    videoCount > 0,
    !!profile?.starting_price,
    !!profile?.years_of_experience,
  ];
  const score = Math.round((scoreFields.filter(Boolean).length / 10) * 100);

  // VIP Next Show
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  let daysUntilNext = 0;
  if (nextEvent?.date) {
    const eventTime = new Date(nextEvent.date).getTime();
    const todayTime = new Date().setHours(0, 0, 0, 0);
    daysUntilNext = Math.max(0, Math.ceil((eventTime - todayTime) / (1000 * 60 * 60 * 24)));
  }

  // Pipeline earnings
  const pipelineEarnings = upcomingEvents.reduce((sum, ev) => sum + (ev.amount || 0), 0);

  // Profile Optimization checklist
  const checklistItems = [
    {
      title: 'Stage Video Showreels',
      description: videoCount > 0 ? `${videoCount} video(s) active` : 'Add live clips to boost bookings 3x',
      href: '/portfolio',
      completed: videoCount > 0,
      icon: Video,
      color: 'var(--color-primary)',
    },
    {
      title: 'Service Packages & Pricing',
      description: serviceCount > 0 ? `${serviceCount} package(s) configured` : 'Add wedding & corporate pricing packages',
      href: '/portfolio',
      completed: serviceCount > 0,
      icon: Package,
      color: '#10B981',
    },
    {
      title: 'Stage Photo Portfolio',
      description: (profile?.photos?.length ?? 0) > 0 ? `${profile?.photos?.length} stage photo(s)` : 'Upload high-res DSLR crowd shots',
      href: '/portfolio',
      completed: (profile?.photos?.length ?? 0) > 0,
      icon: ImageIcon,
      color: '#F59E0B',
    },
    {
      title: 'Bio & Experience Details',
      description: profile?.bio ? 'Profile details completed' : 'Tell event planners about your style',
      href: '/portfolio',
      completed: !!(profile?.bio && profile?.years_of_experience),
      icon: Star,
      color: '#6366F1',
    },
  ];

  return (
    <div className={cn('container', styles.container)}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {firstName}! 👋</h1>
          <div className={styles.subtitleRow}>
            <p className={styles.subtitle}>Here&apos;s your live creator overview and bookings pipeline.</p>
            {profile?.slug && (
              <Link href={`/${profile.slug}`} target="_blank" className={styles.liveBadge}>
                <span className={styles.liveDot} />
                Live: stagehost.in/{profile.slug}
              </Link>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Link href="/portfolio" className={cn(styles.actionBtn, styles.actionBtnPrimary)}>
            <Sparkles size={15} />
            <span>Edit Portfolio</span>
          </Link>
          {profile?.slug && (
            <Link href={`/${profile.slug}`} target="_blank" className={cn(styles.actionBtn, styles.actionBtnSecondary)}>
              <ExternalLink size={15} />
              <span>View Profile</span>
            </Link>
          )}
          {profile?.slug && (
            <DashboardShareButton
              slug={profile.slug}
              name={profile.name || 'Anchor'}
              tagline={profile.tagline || ''}
              className={cn(styles.actionBtn, styles.actionBtnSecondary)}
            />
          )}
          {profile && (
            <DashboardMediaKitButton
              profile={profile}
              className={cn(styles.actionBtn, styles.actionBtnSecondary)}
            />
          )}
        </div>
      </div>

      {/* VIP Next Show Highlight Banner (Clickable) */}
      {nextEvent && (
        <Link href="/schedule" className={styles.vipBanner}>
          <div>
            <div
              className={styles.vipBadge}
              style={
                nextEvent.booking_status === 'tentative'
                  ? { background: 'rgba(245, 158, 11, 0.18)', color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.35)' }
                  : undefined
              }
            >
              <Sparkles size={13} /> {nextEvent.booking_status === 'tentative' ? '🟡 Next Tentative Hold (Pencil Hold)' : 'Next Confirmed Show'}
            </div>
            <div className={styles.vipTitle}>
              {nextEvent.event_name || nextEvent.event_type || 'Confirmed Event'}
            </div>
            <div className={styles.vipDetails}>
              <span>📅 {nextEvent.date}</span>
              <span>·</span>
              <span>{nextEvent.slot_type === 'morning' ? '🌅 Morning Slot' : '🌙 Evening Slot'}</span>
              <span>·</span>
              <span><MapPin size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {nextEvent.event_city || 'Venue TBD'}</span>
              {nextEvent.client_name && (
                <>
                  <span>·</span>
                  <span>Client: {nextEvent.client_name}</span>
                </>
              )}
              {nextEvent.cue_notes && (
                <>
                  <span>·</span>
                  <span style={{ color: '#38BDF8', fontWeight: 600 }}>📋 Run Sheet Ready</span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <span className={styles.vipCountdownBadge}>
              {daysUntilNext === 0 ? 'Today! 🚀' : `In ${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''}`}
            </span>
            <span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
              View Run Sheet & Slip <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      )}

      {/* 4 Stats Cards — All Fully Clickable with Rich Hover Effects */}
      <div className={styles.statsGrid}>
        {/* 1. Profile Views -> /analytics */}
        <Link href="/analytics" className={styles.statCardLink} title="Click to view detailed visitor analytics">
          <div className={styles.statLabelRow}>
            <span className={styles.statLabel}>Profile Views</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={18} color="var(--color-primary)" />
              <ArrowUpRight size={15} className={styles.statArrow} />
            </div>
          </div>
          <div className={styles.statMainValue}>0</div>
          <div className={styles.statFooter}>
            <TrendingUp size={12} color="var(--color-primary)" />
            <span>Realtime tracking active</span>
          </div>
        </Link>

        {/* 2. Inquiries -> /inquiries */}
        <Link href="/inquiries" className={styles.statCardLink} title="Click to view and respond to inquiries">
          <div className={styles.statLabelRow}>
            <span className={styles.statLabel}>Inquiries</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={18} color="var(--color-accent)" />
              <ArrowUpRight size={15} className={styles.statArrow} />
            </div>
          </div>
          <div className={styles.statMainValue}>{inquiryCounts.total}</div>
          <div className={styles.statFooter}>
            {inquiryCounts.new > 0 ? (
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                {inquiryCounts.new} new unread lead{inquiryCounts.new > 1 ? 's' : ''}
              </span>
            ) : (
              <span>All leads responded</span>
            )}
          </div>
        </Link>

        {/* 3. Upcoming Events -> /schedule */}
        <Link href="/schedule" className={styles.statCardLink} title="Click to open full calendar & bookings">
          <div className={styles.statLabelRow}>
            <span className={styles.statLabel}>Upcoming Shows</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={18} color="#10B981" />
              <ArrowUpRight size={15} className={styles.statArrow} />
            </div>
          </div>
          <div className={styles.statMainValue}>{upcomingEvents.length}</div>
          <div className={styles.statFooter}>
            {pipelineEarnings > 0 ? (
              <span style={{ color: '#10B981', fontWeight: 600 }}>
                ₹{pipelineEarnings.toLocaleString('en-IN')} pipeline
              </span>
            ) : (
              <span>Confirmed tour dates</span>
            )}
          </div>
        </Link>

        {/* 4. Portfolio Score -> /portfolio */}
        <Link href="/portfolio" className={styles.statCardLink} title="Click to optimize your portfolio">
          <div className={styles.statLabelRow}>
            <span className={styles.statLabel}>Portfolio Score</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={18} color="#F59E0B" />
              <ArrowUpRight size={15} className={styles.statArrow} />
            </div>
          </div>
          <div className={styles.statMainValue}>{score}%</div>
          <div className={styles.statFooter}>
            {score < 100 ? (
              <span style={{ color: '#F59E0B' }}>
                {10 - scoreFields.filter(Boolean).length} optimizations pending
              </span>
            ) : (
              <span style={{ color: '#10B981' }}>✓ 100% Complete</span>
            )}
          </div>
        </Link>
      </div>

      {/* Quick Creator Launchpad (All Clickable) */}
      <div className={styles.toolsGrid}>
        <Link href="/schedule" className={styles.toolCard}>
          <div className={styles.toolIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div className={styles.toolTitle}>Manage Calendar</div>
            <div className={styles.toolSub}>Book dates or block slots</div>
          </div>
          <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
        </Link>

        <Link href="/portfolio" className={styles.toolCard}>
          <div className={styles.toolIcon} style={{ background: 'rgba(108, 92, 231, 0.12)', color: 'var(--color-primary)' }}>
            <Video size={20} />
          </div>
          <div>
            <div className={styles.toolTitle}>Videos & Photos</div>
            <div className={styles.toolSub}>{videoCount} clips · {profile?.photos?.length ?? 0} photos</div>
          </div>
          <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
        </Link>

        <Link href="/portfolio" className={styles.toolCard}>
          <div className={styles.toolIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
            <Package size={20} />
          </div>
          <div>
            <div className={styles.toolTitle}>Packages & Rates</div>
            <div className={styles.toolSub}>{serviceCount} pricing package(s)</div>
          </div>
          <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
        </Link>

        <Link href="/inquiries" className={styles.toolCard}>
          <div className={styles.toolIcon} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div className={styles.toolTitle}>Client Inquiries</div>
            <div className={styles.toolSub}>{inquiryCounts.total} total received</div>
          </div>
          <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
        </Link>
      </div>

      {/* Upcoming Bookings Section */}
      <div className={styles.sectionHeaderRow}>
        <h2 className={styles.sectionTitle}>
          <Calendar size={20} color="#10B981" />
          Upcoming Bookings
        </h2>
        <Link href="/schedule" className={styles.viewAllLink}>
          View Full Schedule & Calendar <ArrowRight size={14} />
        </Link>
      </div>

      {upcomingEvents.length > 0 ? (
        <div className={styles.bookingsGrid}>
          {upcomingEvents.map(event => {
            const dateObj = formatEventDate(event.date);
            return (
              <Link
                key={event.id}
                href="/schedule"
                className={styles.bookingCardLink}
                title="Click to view details or edit booking in Schedule"
              >
                <div className={styles.datePill}>
                  <span className={styles.dateMonth}>{dateObj.month}</span>
                  <span className={styles.dateDay}>{dateObj.day}</span>
                </div>
                <div className={styles.bookingInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={styles.bookingTitle}>
                      {event.event_name || event.event_type || 'Live Performance'}
                    </span>
                    {event.booking_status === 'tentative' ? (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#F59E0B',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        🟡 Pencil Hold
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        🟢 Confirmed
                      </span>
                    )}
                  </div>
                  <div className={styles.bookingMeta}>
                    <span>{event.slot_type === 'morning' ? '🌅 Morning' : '🌙 Evening'}</span>
                    <span>•</span>
                    <span>{event.event_city || 'Location TBD'}</span>
                    {event.amount && event.amount > 0 && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#10B981', fontWeight: 600 }}>
                          ₹{event.amount.toLocaleString('en-IN')}
                        </span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {event.client_name && <span>Client: {event.client_name}</span>}
                    {event.cue_notes && (
                      <span style={{ color: '#38BDF8', fontWeight: 500 }}>📋 Run Sheet Attached</span>
                    )}
                  </div>
                </div>
                <ArrowRight size={16} className={styles.cardArrow} />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="empty-state-icon">
            <Calendar size={28} />
          </div>
          <div className="empty-state-title">No upcoming bookings yet</div>
          <div className="empty-state-text">
            Add confirmed dates in your schedule or share your calendar with event planners.
          </div>
          <div style={{ marginTop: '14px' }}>
            <Link href="/schedule" className="btn btn-secondary btn-sm">
              <Plus size={16} /> Add First Booking
            </Link>
          </div>
        </div>
      )}

      {/* Recent Inquiries Section (Clickable Cards) */}
      <div className={styles.sectionHeaderRow}>
        <h2 className={styles.sectionTitle}>
          <MessageSquare size={20} color="var(--color-accent)" />
          Recent Inquiries
        </h2>
        <Link href="/inquiries" className={styles.viewAllLink}>
          View All ({inquiryCounts.total}) <ArrowRight size={14} />
        </Link>
      </div>

      {inquiries && inquiries.length > 0 ? (
        <div className={styles.inquiriesGrid}>
          {inquiries.slice(0, 4).map(inq => {
            const dateObj = inq.event_date ? formatEventDate(inq.event_date) : null;
            const statusClass =
              inq.status === 'new'
                ? styles.statusNew
                : inq.status === 'contacted'
                ? styles.statusContacted
                : styles.statusConverted;

            return (
              <div
                key={inq.id}
                className={styles.inquiryCard}
              >
                <Link
                  href="/inquiries"
                  className={styles.inquiryCardBody}
                  title="Click to view full inquiry details and history"
                >
                  <div className={styles.inquiryHeader}>
                    <span className={styles.inquiryClientName}>{inq.name}</span>
                    <span className={`${styles.statusPill} ${statusClass}`}>
                      {inq.status}
                    </span>
                  </div>

                  <div className={styles.inquiryDetails}>
                    <div>
                      <strong>{inq.event_type || 'Event Inquiry'}</strong>
                      {dateObj && <span> · {dateObj.month} {dateObj.day}</span>}
                      {inq.event_city && <span> · {inq.event_city}</span>}
                    </div>
                    {inq.message && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                        &ldquo;{inq.message.length > 75 ? `${inq.message.substring(0, 75)}...` : inq.message}&rdquo;
                      </div>
                    )}
                  </div>
                </Link>

                <div className={styles.inquiryFooter}>
                  <span>📞 {inq.phone}</span>
                  {inq.phone && (
                    <a
                      href={getWhatsAppLink(
                        inq.phone,
                        `Hi ${inq.name}, thank you for reaching out regarding your ${inq.event_type || 'event'}. I would love to discuss the details!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.whatsappActionBtn}
                    >
                      <MessageCircle size={12} /> WhatsApp Reply
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="empty-state-icon">
            <MessageSquare size={28} />
          </div>
          <div className="empty-state-title">No client inquiries received yet</div>
          <div className="empty-state-text">
            When event planners or couples submit your booking form, their inquiries appear here in real time.
          </div>
          {profile?.slug && (
            <div style={{ marginTop: '14px' }}>
              <code style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '6px 12px', borderRadius: '6px' }}>
                stagehost.in/{profile.slug}
              </code>
            </div>
          )}
        </div>
      )}

      {/* Profile Strength & Optimization Checklist Widget (if score < 100) */}
      {score < 100 && (
        <div className={styles.checklistCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Portfolio Optimization Checklist
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Complete these items to reach 100% profile strength and rank higher in directory searches.
              </p>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {score}% Complete
            </span>
          </div>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBarFill} style={{ width: `${score}%` }} />
          </div>

          <div className={styles.checklistGrid}>
            {checklistItems.map((item) => {
              const IconComp = item.icon;
              return (
                <Link key={item.title} href={item.href} className={styles.checklistItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: item.completed ? '#10B981' : item.color }}>
                      <IconComp size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {item.completed ? (
                    <CheckCircle2 size={16} color="#10B981" />
                  ) : (
                    <span className="btn btn-ghost btn-xs" style={{ color: 'var(--color-primary)', padding: '2px 6px' }}>
                      Add <ChevronRight size={12} />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
