import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle, HeartHandshake, Zap, Shield, Users, Edit3 } from 'lucide-react';
import { getPageContent } from '@/lib/actions/pages';
import type { AboutContent } from '@/types/pages';
import styles from '@/components/marketing/AboutPage.module.css';

export const metadata = {
  title: 'About Us | StageHost',
  description: 'Learn about StageHost’s mission to empower India’s anchors, emcees, and event hosts with professional digital portfolios.',
};

const VALUE_ICONS = [HeartHandshake, Zap, Shield, Users];

export default async function AboutPage() {
  const content = await getPageContent<AboutContent>('about');

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className={styles.badge}>
            <Sparkles size={14} /> Our Mission &amp; Story
          </div>
          <Link href="/admin/pages" style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Edit3 size={12} /> Edit CMS
          </Link>
        </div>

        <h1 className={styles.headline}>
          {content.headline}
        </h1>
        <p className={styles.subtitle}>
          {content.subtitle}
        </p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {content.stats.map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className={styles.storySection}>
        <h2 className={styles.storyTitle}>Why We Built StageHost</h2>
        <div className={styles.storyText}>{content.story}</div>
      </div>

      {/* Values */}
      <div className={styles.valuesSection}>
        <div className={styles.sectionHeader}>
          <h3>Our Core Principles</h3>
          <p>The driving forces behind every feature we build for artists.</p>
        </div>

        <div className={styles.valuesGrid}>
          {content.values.map((v, i) => {
            const Icon = VALUE_ICONS[i % VALUE_ICONS.length] || CheckCircle;
            return (
              <div key={i} className={styles.valueCard}>
                <h4>
                  <Icon size={20} color="var(--color-accent)" />
                  {v.title}
                </h4>
                <p>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <h2>Ready to Build Your Digital Stage?</h2>
        <p>
          Join hundreds of professional emcees who are growing their bookings and commanding premium rates with StageHost.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-accent btn-lg">
            Create Your Free Portfolio <ArrowRight size={18} />
          </Link>
          <Link href="/directory" className="btn btn-ghost btn-lg">
            Browse Anchor Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
