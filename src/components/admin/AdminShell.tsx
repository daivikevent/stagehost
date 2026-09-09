'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './AdminShell.module.css';

const ADMIN_NAV = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users & Anchors' },
  { href: '/admin/plans', icon: CreditCard, label: 'Plans & Pricing' },
  { href: '/admin/payments', icon: BarChart3, label: 'Payments' },
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
            <Link href="/" className={styles.logo}>
              <Sparkles size={20} />
              {!collapsed && <span>StageHost</span>}
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
          <Link href="/admin/dashboard" className={styles.mobileLogo}>
            <Sparkles size={18} style={{ color: '#ec4899' }} />
            <span>StageHost</span>
            <span className={styles.mobileAdminTag}>ADMIN</span>
          </Link>
          <Link
            href="/dashboard"
            className={styles.mobileAnchorLink}
            title="Switch to Anchor Dashboard"
          >
            <LayoutDashboard size={17} />
          </Link>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>
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
