'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles, LayoutDashboard, User, Video, Image, Package,
  Calendar, MessageSquare, BarChart3, Settings, ExternalLink,
  LogOut, ChevronLeft, Menu, X, Shield, Megaphone, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { stopImpersonation } from '@/lib/actions/admin';
import type { AnnouncementBanner } from '@/types';
import styles from './DashboardLayout.module.css';

const SIDEBAR_LINKS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/portfolio', icon: User, label: 'Profile' },
  { href: '/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/inquiries', icon: MessageSquare, label: 'Inquiries' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const MOBILE_NAV_LINKS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/portfolio', icon: User, label: 'Portfolio' },
  { href: '/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/inquiries', icon: MessageSquare, label: 'Inquiries' },
  { href: '/settings', icon: Settings, label: 'More' },
];

interface DashboardShellProps {
  children: React.ReactNode;
  userName?: string;
  userSlug?: string;
  isAdmin?: boolean;
  impersonation?: {
    isImpersonating: boolean;
    userId?: string;
    anchorName?: string;
  };
  announcement?: AnnouncementBanner;
}

export function DashboardShell({
  children,
  userName,
  userSlug,
  isAdmin,
  impersonation,
  announcement,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('stagehost_announcement_dismissed');
      if (dismissed === 'true') {
        setBannerDismissed(true);
      }
    }
  }, []);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleExitImpersonation = async () => {
    await stopImpersonation();
    window.location.href = '/admin/users';
  };

  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <div className={styles.layout}>
      {/* Desktop Sidebar */}
      <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <Sparkles size={22} />
            {!collapsed && <span>StageHost</span>}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            <ChevronLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {SIDEBAR_LINKS.map(link => (
            <Link key={link.href} href={link.href} prefetch={true} className={cn(styles.navItem, isActive(link.href) && styles.active)} title={collapsed ? link.label : undefined}>
              <link.icon size={20} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={cn(styles.navItem, pathname.startsWith('/admin') && styles.active)}
              title={collapsed ? 'Admin Panel' : undefined}
              style={{
                color: '#a855f7',
                marginBottom: '6px',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '8px',
              }}
            >
              <Shield size={20} color="#a855f7" />
              {!collapsed && (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Admin Panel</span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                  }}>
                    ADMIN
                  </span>
                </span>
              )}
            </Link>
          )}
          {userSlug && (
            <a href={`/${userSlug}`} target="_blank" rel="noopener noreferrer" className={styles.navItem} title={collapsed ? 'View Portfolio' : undefined}>
              <ExternalLink size={20} />
              {!collapsed && <span>View Portfolio</span>}
            </a>
          )}
          <button className={cn(styles.navItem, styles.logoutBtn)} onClick={handleSignOut}>
            <LogOut size={20} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(styles.main, collapsed && styles.mainCollapsed)}>
        {/* Mobile Header */}
        <header className={styles.mobileHeader}>
          <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <Link href="/" className={styles.mobileLogo}>
            <Sparkles size={20} />
            <span>StageHost</span>
          </Link>
          <div className="avatar avatar-sm" style={{ cursor: 'pointer' }}>{initials}</div>
        </header>

        {/* Admin Impersonation Sticky Banner */}
        {impersonation?.isImpersonating && (
          <div style={{
            background: 'linear-gradient(90deg, #b45309, #78350f)',
            color: '#fef3c7',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 500,
            borderBottom: '1px solid #f59e0b',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            zIndex: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="#fbbf24" />
              <span>
                Viewing StageHost as <strong>{impersonation.anchorName || 'Anchor'}</strong> (Admin Support Mode)
              </span>
            </div>
            <button
              onClick={handleExitImpersonation}
              style={{
                background: '#fbbf24',
                color: '#78350f',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 150ms',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Exit & Return to Admin
            </button>
          </div>
        )}

        {/* Platform Announcement Broadcast Bar */}
        {announcement?.is_active && announcement?.message && !bannerDismissed && (
          <div style={{
            background: announcement.type === 'warning'
              ? 'rgba(245, 158, 11, 0.12)'
              : announcement.type === 'success'
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(99, 102, 241, 0.12)',
            borderBottom: `1px solid ${
              announcement.type === 'warning'
                ? 'rgba(245, 158, 11, 0.3)'
                : announcement.type === 'success'
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(99, 102, 241, 0.3)'
            }`,
            color: announcement.type === 'warning'
              ? '#f59e0b'
              : announcement.type === 'success'
              ? '#10b981'
              : '#818cf8',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 500,
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <Megaphone size={16} style={{ flexShrink: 0 }} />
              <span>{announcement.message}</span>
              {announcement.link_url && (
                <Link
                  href={announcement.link_url}
                  style={{
                    color: 'var(--color-primary, #6366f1)',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '6px',
                  }}
                >
                  {announcement.link_text || 'Check Details'} <ArrowRight size={13} />
                </Link>
              )}
            </div>
            <button
              onClick={() => {
                setBannerDismissed(true);
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('stagehost_announcement_dismissed', 'true');
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'currentColor',
                opacity: 0.7,
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Dismiss Announcement"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className={styles.content}>{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className={styles.mobileNav}>
        {MOBILE_NAV_LINKS.map(link => (
          <Link key={link.href} href={link.href} className={cn(styles.mobileNavItem, isActive(link.href) && styles.mobileNavActive)}>
            <link.icon size={20} />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile Slide-in Menu */}
      {mobileOpen && (
        <>
          <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
          <div className={styles.mobileSlide}>
            <div className={styles.mobileSlideHeader}>
              <Link href="/" className={styles.mobileLogo}><Sparkles size={20} /><span>StageHost</span></Link>
              <button onClick={() => setMobileOpen(false)}><X size={22} /></button>
            </div>
            {SIDEBAR_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={cn(styles.navItem, isActive(link.href) && styles.active)} onClick={() => setMobileOpen(false)}>
                <link.icon size={20} /><span>{link.label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className={cn(styles.navItem, pathname.startsWith('/admin') && styles.active)}
                onClick={() => setMobileOpen(false)}
                style={{
                  color: '#a855f7',
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: '8px',
                  marginTop: '10px',
                  marginBottom: '6px',
                }}
              >
                <Shield size={20} color="#a855f7" />
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Admin Panel</span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    fontWeight: 700
                  }}>
                    ADMIN
                  </span>
                </span>
              </Link>
            )}
            {userSlug && (
              <a href={`/${userSlug}`} target="_blank" rel="noopener noreferrer" className={styles.navItem} onClick={() => setMobileOpen(false)}>
                <ExternalLink size={20} /><span>View Portfolio</span>
              </a>
            )}
            <button className={cn(styles.navItem, styles.logoutBtn)} onClick={handleSignOut}>
              <LogOut size={20} /><span>Log Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
