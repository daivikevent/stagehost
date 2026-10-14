'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Gift,
  Palette,
  FileText,
  Inbox,
  Settings,
  Sparkles,
  ShieldCheck,
  Plus,
  Tag,
  ArrowRight,
  ExternalLink,
  LogOut,
  Sliders,
  Bell,
  Globe,
} from 'lucide-react';
import styles from './AdminCommandBar.module.css';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Quick Actions' | 'Settings';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number }>;
  action: () => void;
  tag?: string;
}

export function AdminCommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle open with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleNavigate = useCallback(
    (url: string) => {
      setIsOpen(false);
      router.push(url);
    },
    [router]
  );

  const commandItems: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-overview',
        category: 'Navigation',
        title: 'Admin Overview & Metrics',
        subtitle: 'MRR, active anchors, and conversion pipeline',
        icon: LayoutDashboard,
        action: () => handleNavigate('/admin/dashboard'),
      },
      {
        id: 'nav-users',
        category: 'Navigation',
        title: 'Users & Anchors Management',
        subtitle: 'Search, filter, view portfolios and directory listings',
        icon: Users,
        action: () => handleNavigate('/admin/users'),
      },
      {
        id: 'nav-verifications',
        category: 'Navigation',
        title: 'Artist Verification Queue',
        subtitle: 'Review & approve Blue Tick verified badges',
        icon: ShieldCheck,
        action: () => handleNavigate('/admin/users?filter=verification'),
        tag: 'Verification',
      },
      {
        id: 'nav-plans',
        category: 'Navigation',
        title: 'Plans & Pricing Manager',
        subtitle: 'Configure subscription tiers, limits & bullet points',
        icon: CreditCard,
        action: () => handleNavigate('/admin/plans'),
      },
      {
        id: 'nav-payments',
        category: 'Navigation',
        title: 'Payments & Razorpay Transactions',
        subtitle: 'View live subscriber charges and revenue logs',
        icon: BarChart3,
        action: () => handleNavigate('/admin/payments'),
      },
      {
        id: 'nav-referrals',
        category: 'Navigation',
        title: 'Referrals & Affiliate Rewards',
        subtitle: 'Track anchor commission payouts & invited artists',
        icon: Gift,
        action: () => handleNavigate('/admin/referrals'),
      },
      {
        id: 'nav-themes',
        category: 'Navigation',
        title: 'Global Platform Themes',
        subtitle: 'Customize neon color schemes & visual palettes',
        icon: Palette,
        action: () => handleNavigate('/admin/themes'),
      },
      {
        id: 'nav-pages',
        category: 'Navigation',
        title: 'Pages & Legal CMS',
        subtitle: 'Edit terms, privacy, zero-liability disclaimers',
        icon: FileText,
        action: () => handleNavigate('/admin/pages'),
      },
      {
        id: 'nav-inquiries',
        category: 'Navigation',
        title: 'Contact Queries & Support Leads',
        subtitle: 'Client booking queries & direct contact messages',
        icon: Inbox,
        action: () => handleNavigate('/admin/inquiries'),
      },
      {
        id: 'nav-settings',
        category: 'Navigation',
        title: 'Platform Settings & Master Switches',
        subtitle: 'Company GSTIN, 10 feature switches, email keys',
        icon: Settings,
        action: () => handleNavigate('/admin/settings'),
      },

      // Quick Actions
      {
        id: 'action-new-plan',
        category: 'Quick Actions',
        title: 'Add New Subscription Plan',
        subtitle: 'Create a custom subscription tier with limits & pricing',
        icon: Plus,
        action: () => handleNavigate('/admin/plans'),
        tag: 'Action',
      },
      {
        id: 'action-coupon',
        category: 'Quick Actions',
        title: 'Create Promo Discount Code',
        subtitle: 'Create a promo code for anchor subscription discounts',
        icon: Tag,
        action: () => handleNavigate('/admin/plans'),
        tag: 'Action',
      },
      {
        id: 'action-announcement',
        category: 'Quick Actions',
        title: 'Broadcast Announcement Banner',
        subtitle: 'Publish a top live alert banner across the site',
        icon: Bell,
        action: () => handleNavigate('/admin/settings'),
        tag: 'Live',
      },
      {
        id: 'action-feature-switches',
        category: 'Quick Actions',
        title: 'Platform Feature Switches',
        subtitle: 'Toggle Phone OTP, E-Sign, Tech Rider, Review Collector',
        icon: Sliders,
        action: () => handleNavigate('/admin/settings'),
        tag: 'Switches',
      },
      {
        id: 'action-view-directory',
        category: 'Quick Actions',
        title: 'Open Public Artist Directory',
        subtitle: 'View live public directory as seen by event clients',
        icon: Globe,
        action: () => {
          setIsOpen(false);
          window.open('/directory', '_blank');
        },
        tag: 'External',
      },
      {
        id: 'action-view-site',
        category: 'Quick Actions',
        title: 'Open Public Homepage',
        subtitle: 'Visit live landing page',
        icon: ExternalLink,
        action: () => {
          setIsOpen(false);
          window.open('/', '_blank');
        },
        tag: 'External',
      },
      {
        id: 'action-switch-dashboard',
        category: 'Quick Actions',
        title: 'Switch to Anchor Dashboard',
        subtitle: 'Go to your own artist portfolio controls',
        icon: LayoutDashboard,
        action: () => handleNavigate('/dashboard'),
      },
    ],
    [handleNavigate]
  );

  const filteredItems = useMemo(() => {
    if (!query.trim()) return commandItems;
    const q = query.toLowerCase();
    return commandItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tag?.toLowerCase().includes(q)
    );
  }, [commandItems, query]);

  // Handle keyboard arrow navigation
  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={() => setIsOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDownList}>
        <div className={styles.searchHeader}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search pages, actions, settings (e.g. users, plans, gst, verify)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className={styles.escBadge}>ESC</span>
        </div>

        <div className={styles.resultsList}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              No matching pages or actions found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.item} ${isSelected ? styles.itemActive : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={styles.itemLeft}>
                    <div className={styles.itemIcon}>
                      <Icon size={16} />
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{item.title}</div>
                      {item.subtitle && <div className={styles.itemSubtitle}>{item.subtitle}</div>}
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    {item.tag && (
                      <span className={`${styles.tag} ${item.tag === 'Verification' ? styles.tagSuccess : styles.tagPrimary}`}>
                        {item.tag}
                      </span>
                    )}
                    <ArrowRight size={13} style={{ opacity: isSelected ? 1 : 0.25 }} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <span>BookMyArtist Command Center</span>
          <div className={styles.footerShortcuts}>
            <span className={styles.shortcut}>
              <kbd>↑</kbd> <kbd>↓</kbd> Navigate
            </span>
            <span className={styles.shortcut}>
              <kbd>↵</kbd> Select
            </span>
            <span className={styles.shortcut}>
              <kbd>ESC</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
