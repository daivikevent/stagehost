'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sparkles } from 'lucide-react';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/features', label: 'Features', route: '/features' },
  { href: '/how-it-works', label: 'How It Works', route: '/how-it-works' },
  { href: '/pricing', label: 'Pricing', route: '/pricing' },
  { href: '/directory', label: 'Find Anchors', route: '/directory' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isInnerPage = pathname !== '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const isSolid = isInnerPage || isScrolled;

  return (
    <nav
      className={`${styles.navbar} ${isSolid ? styles.solid : ''} ${isScrolled ? styles.scrolled : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Sparkles size={24} />
          <span className={styles.logoText}>StageHost</span>
        </Link>

        {/* Desktop Nav */}
        <div className={styles.desktopNav}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.route;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className={styles.desktopActions}>
          <Link href="/login" className={styles.loginBtn}>
            Log in
          </Link>
          <Link href="/register" className="btn btn-accent">
            Get Started Free
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.route;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${isActive ? styles.active : ''}`}
                onClick={handleLinkClick}
              >
                {link.label}
              </Link>
            );
          })}
          <div className={styles.mobileActions}>
            <Link
              href="/login"
              className="btn btn-ghost btn-block"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="btn btn-accent btn-block"
              onClick={() => setIsOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

