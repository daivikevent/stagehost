'use client';

import { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Palette,
  Settings,
  Sparkles,
  Shield,
  BarChart3,
  LogOut,
  ChevronRight,
  ChevronLeft,
  FileText,
  Inbox,
  Menu,
  X,
  Gift,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { AdminCommandBar } from './AdminCommandBar';
import styles from './AdminShell.module.css';

const ADMIN_NAV = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users & Anchors' },
  { href: '/admin/plans', icon: CreditCard, label: 'Plans & Pricing' },
  { href: '/admin/payments', icon: BarChart3, label: 'Payments' },
  { href: '/admin/referrals', icon: Gift, label: 'Referrals & Rewards' },
  { href: '/admin/themes', icon: Palette, label: 'Themes' },
  { href: '/admin/pages', icon: FileText, label: 'Pages & Legal CMS' },
  { href: '/admin/inquiries', icon: Inbox, label: 'Contact Queries' },
  { href: '/admin/settings', icon: Settings, label: 'Platform Settings' },
];

const ADMIN_BOTTOM_NAV = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/plans', icon: CreditCard, label: 'Plans' },
  { href: '/admin/payments', icon: BarChart3, label: 'Payments' },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={styles.layout}>
      {/* Desktop Sidebar */}
      <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
        <div className={styles.sidebarHeader}>
          <div className={styles.headerTop}>
            <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center' }}>
              {collapsed ? (
                <BrandLogo variant="sidebar-icon" />
              ) : (
                <BrandLogo variant="sidebar" priority />
              )}
            </Link>
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <ChevronLeft
                size={18}
                style={{
                  transform: collapsed ? 'rotate(180deg)' : 'none',
                  transition: 'transform 200ms ease',
                }}
              />
            </button>
          </div>
          {!collapsed && (
            <div className={styles.adminBadge}>
              <Shield size={12} /> Admin
            </div>
          )}
        </div>

        {/* Quick Search Spotlight Button */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          }}
          style={{
            margin: collapsed ? '10px auto 6px' : '10px 12px 6px',
            padding: collapsed ? '8px' : '7px 10px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'rgba(255, 255, 255, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 150ms ease',
            width: collapsed ? '44px' : 'calc(100% - 24px)',
          }}
          title="Search / Command Bar (⌘K)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} color="var(--color-primary)" />
            {!collapsed && <span>Quick Search...</span>}
          </div>
          {!collapsed && (
            <kbd
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              ⌘K
            </kbd>
          )}
        </button>

        <nav className={styles.nav}>
          {ADMIN_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(styles.navItem, pathname.startsWith(link.href) && styles.navActive)}
              title={collapsed ? link.label : undefined}
            >
              <link.icon size={18} />
              {!collapsed && <span>{link.label}</span>}
              {!collapsed && pathname.startsWith(link.href) && (
                <ChevronRight size={14} className={styles.navChevron} />
              )}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link
            href="/dashboard"
            className={styles.navItem}
            title={collapsed ? 'Anchor Dashboard' : 'Go back to Anchor Dashboard'}
          >
            <LayoutDashboard size={18} />
            {!collapsed && <span>Anchor Dashboard</span>}
          </Link>
          <button
            type="button"
            className={cn(styles.navItem, styles.logoutBtn)}
            title={collapsed ? 'Log Out' : undefined}
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client');
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
          >
            <LogOut size={18} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className={cn(styles.main, collapsed && styles.mainCollapsed)}>
        {/* Sticky Mobile Header (< 1024px) */}
        <header className={styles.mobileHeader}>
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setMobileOpen(true)}
            aria-label="Open Admin Menu"
          >
            <Menu size={20} />
          </button>
          <Link href="/admin/dashboard" className={styles.mobileLogo} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BrandLogo variant="navbar-mobile" />
            <span className={styles.mobileAdminTag}>ADMIN</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className={styles.mobileAnchorLink}
              title="Search (⌘K)"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <Search size={17} />
            </button>
            <Link
              href="/dashboard"
              className={styles.mobileAnchorLink}
              title="Switch to Anchor Dashboard"
            >
              <LayoutDashboard size={17} />
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>

        {/* Global Spotlight Command Bar */}
        <AdminCommandBar />
      </main>

      {/* Mobile Slide-in Drawer */}
      {mobileOpen && (
        <>
          <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
          <div className={styles.mobileSlide}>
            <div className={styles.mobileSlideHeader}>
              <div className={styles.mobileSlideTitle}>
                <Sparkles size={18} style={{ color: '#ec4899' }} />
                <span>Admin Suite</span>
                <span className={styles.mobileAdminTag}>CONTROL</span>
              </div>
              <button
                type="button"
                className={styles.mobileCloseBtn}
                onClick={() => setMobileOpen(false)}
                aria-label="Close Menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className={styles.mobileNavLinks}>
              {ADMIN_NAV.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(styles.navItem, isActive && styles.navActive)}
                    onClick={() => setMobileOpen(false)}
                  >
                    <link.icon size={18} />
                    <span>{link.label}</span>
                    {isActive && <ChevronRight size={14} className={styles.navChevron} />}
                  </Link>
                );
              })}
            </nav>

            <div className={styles.mobileDrawerFooter}>
              <Link
                href="/dashboard"
                className={styles.navItem}
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={18} />
                <span>Switch to Anchor View</span>
              </Link>
              <button
                type="button"
                className={cn(styles.navItem, styles.logoutBtn)}
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client');
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Fixed Mobile Bottom Nav (< 1024px) */}
      <nav className={styles.mobileBottomNav}>
        {ADMIN_BOTTOM_NAV.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                styles.mobileBottomItem,
                isActive && styles.mobileBottomItemActive
              )}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={cn(
            styles.mobileBottomItem,
            mobileOpen && styles.mobileBottomItemActive
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="More Admin Tools"
        >
          <Menu size={18} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
