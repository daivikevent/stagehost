'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  X,
  ArrowRight,
  CheckCircle2,
  Mic,
  CalendarCheck,
  Shield,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Rocket,
} from 'lucide-react';
import {
  PLATFORM_DOC_CATEGORIES,
  PLATFORM_FEATURES_REGISTRY,
  FUTURE_ROADMAP_ITEMS,
  type PlatformFeature,
  type FutureRoadmapItem,
} from '@/constants/documentation';
import styles from './HowItWorks.module.css';

interface HowItWorksClientProps {
  customFeatures?: PlatformFeature[];
}

const FAQS = [
  {
    q: 'How much commission does StageHost charge on event bookings?',
    a: 'Zero percent (0%). StageHost is 100% commission-free. All booking fees, deposits, and client payments go directly from the client to the anchor via direct UPI/bank transfer or personal invoice.',
  },
  {
    q: 'Can I connect my own custom domain like anchorname.live or emceepriya.com?',
    a: 'Yes! On the Premium plan, you can connect your apex or subdomain. You only need to add a single CNAME record pointing to cname.stagehost.in. SSL certificates are provisioned automatically via Let\'s Encrypt.',
  },
  {
    q: 'How do video showreels work? Can I upload directly or embed from YouTube?',
    a: 'You can embed YouTube videos and shorts, Instagram reels, Facebook videos, or share Google Drive media links. StageHost automatically fetches the video thumbnail and embeds a high-speed player on your profile.',
  },
  {
    q: 'How does the Live Booking Calendar prevent double bookings?',
    a: 'You can mark any date as Morning, Evening, or Full Day booked. If an event planner attempts to inquire for a booked date, the system alerts them that you are unavailable or suggests inquiring for an alternate date.',
  },
  {
    q: 'How do I get the Verified Blue Tick and Spotlight Badge in the directory?',
    a: 'Verified badges are awarded to anchors who have completed their full profile, added active showreels, and confirmed their phone number and past event credentials.',
  },
];

export function HowItWorksClient({ customFeatures = [] }: HowItWorksClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Combine custom features with registry
  const allFeatures = useMemo(() => {
    const list = [...customFeatures, ...PLATFORM_FEATURES_REGISTRY];
    const map = new Map<string, PlatformFeature>();
    list.forEach((f) => {
      if (!map.has(f.id)) map.set(f.id, f);
    });
    return Array.from(map.values());
  }, [customFeatures]);

  // Filter Categories by Search & Active Tab
  const filteredCategories = useMemo(() => {
    return PLATFORM_DOC_CATEGORIES.map((cat) => {
      // If tab is not 'all' and not matching this cat, skip
      if (activeTab !== 'all' && activeTab !== cat.id) {
        return { ...cat, steps: [] };
      }

      if (!searchQuery.trim()) return cat;

      const q = searchQuery.toLowerCase();
      const matchingSteps = cat.steps.filter(
        (step) =>
          step.title.toLowerCase().includes(q) ||
          step.subtitle.toLowerCase().includes(q) ||
          step.description.toLowerCase().includes(q) ||
          step.highlights.some((h) => h.toLowerCase().includes(q))
      );

      return { ...cat, steps: matchingSteps };
    }).filter((cat) => cat.steps.length > 0);
  }, [searchQuery, activeTab]);

  // Filter Features Registry
  const filteredFeatures = useMemo(() => {
    if (activeTab !== 'all' && activeTab !== 'features') {
      return [];
    }

    if (!searchQuery.trim()) return allFeatures;

    const q = searchQuery.toLowerCase();
    return allFeatures.filter(
      (feat) =>
        feat.title.toLowerCase().includes(q) ||
        feat.summary.toLowerCase().includes(q) ||
        feat.tags.some((t) => t.toLowerCase().includes(q)) ||
        feat.howToUse.some((h) => h.toLowerCase().includes(q))
    );
  }, [searchQuery, activeTab, allFeatures]);

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.badge}>
          <BookOpen size={13} /> Complete Platform User Guide
        </div>
        <h1 className={styles.headline}>
          How <span className={styles.headlineGradient}>StageHost</span> Works
        </h1>
        <p className={styles.subtitle}>
          Everything you need to master your digital anchor stage, manage availability, receive direct WhatsApp bookings, and book top event talent.
        </p>

        {/* Real-time Interactive Search Bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search features, guides (e.g. 'WhatsApp', 'Calendar', 'YouTube', 'Theme')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('all')}
          >
            🌟 All Documentation
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'getting-started' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('getting-started')}
          >
            <Sparkles size={14} /> Getting Started
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'anchors-guide' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('anchors-guide')}
          >
            <Mic size={14} /> For Anchors &amp; Emcees
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'planners-guide' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('planners-guide')}
          >
            <CalendarCheck size={14} /> For Event Planners
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'admin-guide' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('admin-guide')}
          >
            <Shield size={14} /> Master Admin
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'features' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <Layers size={14} /> Feature Directory ({allFeatures.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'roadmap' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('roadmap')}
          >
            <Rocket size={14} /> Future Scope &amp; Roadmap ({FUTURE_ROADMAP_ITEMS.length})
          </button>
        </div>
      </div>

      {/* 1. Step-by-Step Interactive Guides */}
      {filteredCategories.map((cat) => (
        <section key={cat.id} className={styles.docSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {cat.id === 'getting-started' && <Sparkles size={22} color="var(--color-primary)" />}
              {cat.id === 'anchors-guide' && <Mic size={22} color="var(--color-primary)" />}
              {cat.id === 'planners-guide' && <CalendarCheck size={22} color="var(--color-primary)" />}
              {cat.id === 'admin-guide' && <Shield size={22} color="var(--color-primary)" />}
              {cat.title}
            </h2>
            <p className={styles.sectionDesc}>{cat.description}</p>
          </div>

          <div className={styles.stepsGrid}>
            {cat.steps.map((step) => (
              <div key={step.stepNumber} className={styles.stepCard}>
                <div className={styles.stepCardHeader}>
                  <div className={styles.stepBadgeNumber}>{step.stepNumber}</div>
                  <div className={styles.stepTitleBlock}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <div className={styles.stepSubtitle}>{step.subtitle}</div>
                  </div>
                </div>

                <p className={styles.stepDescription}>{step.description}</p>

                <div className={styles.highlightsList}>
                  {step.highlights.map((h, idx) => (
                    <div key={idx} className={styles.highlightItem}>
                      <span className={styles.highlightDot} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {step.actionUrl && (
                  <div className={styles.stepActionFooter}>
                    <Link href={step.actionUrl} className="btn btn-xs btn-primary">
                      {step.actionText || 'Explore'} <ChevronRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* 2. Platform Feature Directory (Auto-Updating Registry) */}
      {(activeTab === 'all' || activeTab === 'features') && filteredFeatures.length > 0 && (
        <section className={styles.docSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Layers size={22} color="var(--color-accent)" />
              Platform Feature Directory &amp; Capabilities
            </h2>
            <p className={styles.sectionDesc}>
              A live, auto-updating catalog of every single tool, module, and feature in the StageHost platform.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {filteredFeatures.map((feat) => (
              <div key={feat.id} className={styles.featureCard}>
                <div className={styles.featureCardTop}>
                  <div className={styles.featureTitleArea}>
                    <h3 className={styles.featureName}>{feat.title}</h3>
                    <span className={styles.featureVersion}>
                      {feat.version} · {feat.lastUpdated}
                    </span>
                  </div>

                  <div className={styles.featureBadges}>
                    <span
                      className={`${styles.statusBadge} ${
                        feat.status === 'New' ? styles.new : styles.live
                      }`}
                    >
                      {feat.status}
                    </span>
                    <span className={styles.tierBadge}>{feat.tier}</span>
                  </div>
                </div>

                <p className={styles.featureSummary}>{feat.summary}</p>

                <div className={styles.howToUseBlock}>
                  <div className={styles.howToUseLabel}>How to Use</div>
                  <ul className={styles.howToUseList}>
                    {feat.howToUse.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2.5 Future Scope & Upcoming Development Roadmap */}
      {(activeTab === 'all' || activeTab === 'roadmap') && (
        <section className={styles.docSection}>
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <h2 className={styles.sectionTitle}>
                <Rocket size={22} color="#F59E0B" />
                Future Scope Development &amp; Platform Roadmap
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#FBBF24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                Upcoming 2026–2027 Pipeline
              </span>
            </div>
            <p className={styles.sectionDesc}>
              A transparent look at enterprise tools, backstage co-pilots, and international capabilities currently under design and scheduled development.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {FUTURE_ROADMAP_ITEMS.map((item) => (
              <div
                key={item.id}
                className={styles.featureCard}
                style={{
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                  background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, rgba(20, 24, 38, 0.8) 100%)',
                }}
              >
                <div className={styles.featureCardTop}>
                  <div className={styles.featureTitleArea}>
                    <h3 className={styles.featureName} style={{ color: '#FCD34D' }}>
                      {item.title}
                    </h3>
                    <span className={styles.featureVersion} style={{ color: '#FBBF24', fontWeight: 600 }}>
                      Target: {item.quarter} · {item.category}
                    </span>
                  </div>

                  <div className={styles.featureBadges}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background:
                          item.status === 'In Design'
                            ? 'rgba(168, 85, 247, 0.2)'
                            : item.status === 'Planned'
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                        color:
                          item.status === 'In Design'
                            ? '#C084FC'
                            : item.status === 'Planned'
                            ? '#60A5FA'
                            : '#FCD34D',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <p className={styles.featureSummary}>{item.summary}</p>

                <div className={styles.howToUseBlock}>
                  <div className={styles.howToUseLabel} style={{ color: '#FCD34D' }}>
                    Key Planned Capabilities
                  </div>
                  <ul className={styles.howToUseList}>
                    {item.keyCapabilities.map((cap, idx) => (
                      <li key={idx}>{cap}</li>
                    ))}
                  </ul>
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '11.5px',
                      color: '#E2E8F0',
                    }}
                  >
                    💡 <strong>Artist Impact:</strong> {item.impactForArtists}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Frequently Asked Questions */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <HelpCircle size={22} color="var(--color-primary)" />
            Frequently Asked Questions
          </h2>
          <p className={styles.sectionDesc}>
            Quick answers about StageHost workflows, payments, and client booking guarantees.
          </p>
        </div>

        <div className={styles.faqGrid}>
          {FAQS.map((faq, i) => (
            <div key={i} className={styles.faqCard}>
              <h3 className={styles.faqQuestion}>{faq.q}</h3>
              <p className={styles.faqAnswer}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <div className={styles.ctaBanner}>
        <h2 className={styles.ctaTitle}>Ready to Command Your Digital Stage?</h2>
        <p className={styles.ctaText}>
          Join hundreds of top-rated wedding, corporate, and celebrity anchors across India. Build your stage in 3 minutes.
        </p>
        <div className={styles.ctaActions}>
          <Link href="/register" className="btn btn-accent btn-lg">
            Create Your Portfolio Free <ArrowRight size={18} />
          </Link>
          <Link href="/directory" className="btn btn-ghost btn-lg">
            Browse Verified Anchors
          </Link>
        </div>
      </div>
    </div>
  );
}
