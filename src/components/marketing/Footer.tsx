'use client';

import Link from 'next/link';
import { Sparkles, ShieldCheck } from 'lucide-react';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.footerLogo}>
            <Sparkles size={20} />
            <span>BookMyArtist</span>
          </Link>
          <p>
            Your Talent. Your Brand. Your Bookings. India&apos;s dedicated digital portfolio &amp; booking management platform for live artists, performers, anchors, DJs, singers, and entertainment talent.
          </p>
          <div className={styles.footerBadge}>
            <ShieldCheck size={14} /> 100% Commission-Free
          </div>
        </div>

        <div className={styles.footerLinks}>
          <div className={styles.footerCol}>
            <h5>Product</h5>
            <Link href="/features" className={styles.footerLink}>
              Features
            </Link>
            <Link href="/how-it-works" className={styles.footerLink}>
              How It Works &amp; Docs
            </Link>
            <Link href="/pricing" className={styles.footerLink}>
              Pricing
            </Link>
            <Link href="/artists" className={styles.footerLink}>
              Find Artists
            </Link>
          </div>

          <div className={styles.footerCol}>
            <h5>Company</h5>
            <Link href="/about" className={styles.footerLink}>
              About
            </Link>
            <Link href="/blog" className={styles.footerLink}>
              Blog &amp; Guides
            </Link>
            <Link href="/contact" className={styles.footerLink}>
              Contact
            </Link>
          </div>

          <div className={styles.footerCol}>
            <h5>Legal</h5>
            <Link href="/privacy" className={styles.footerLink}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={styles.footerLink}>
              Terms of Service
            </Link>
            <Link href="/refund" className={styles.footerLink}>
              Refund Policy
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>© {currentYear} BookMyArtist. All rights reserved. Made with ❤️ in India.</p>
        <div className={styles.footerBottomLinks}>
          <Link href="/privacy">Privacy</Link>
          <span>·</span>
          <Link href="/terms">Terms</Link>
          <span>·</span>
          <Link href="/refund">Refunds</Link>
        </div>
      </div>
    </footer>
  );
}
