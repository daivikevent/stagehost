'use client';

import Link from 'next/link';
import { useScrollRevealContainer } from '@/hooks/useScrollReveal';
import {
  Sparkles,
  Video,
  Calendar,
  Globe,
  BarChart3,
  MessageSquare,
  Shield,
  Zap,
  Users,
  Palette,
  Star,
  ArrowRight,
  Check,
  ChevronDown,
} from 'lucide-react';
import styles from './LandingPage.module.css';
import { useState } from 'react';

/* =============================================
   FEATURES DATA
   ============================================= */
const FEATURES = [
  {
    icon: Globe,
    title: 'Stunning Portfolio Website',
    description:
      'Get your own professional website that wows clients. Embed YouTube, Instagram, and Facebook videos seamlessly.',
  },
  {
    icon: Calendar,
    title: 'Smart Schedule Manager',
    description:
      'Manage morning & evening slots, track bookings, and auto-block travel days for out-of-city events.',
  },
  {
    icon: Video,
    title: 'Video Showcase',
    description:
      'Showcase your best performances from YouTube, Instagram, Facebook, and Google Drive — all in one place.',
  },
  {
    icon: MessageSquare,
    title: 'Inquiry & Lead Management',
    description:
      'Receive inquiries directly on your portfolio. Track leads, follow up, and convert more clients.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description:
      'Know who\'s viewing your portfolio, which videos get clicks, and where your inquiries come from.',
  },
  {
    icon: Palette,
    title: 'Beautiful Themes',
    description:
      'Choose from stunning, hand-crafted themes designed for the events industry. Switch anytime.',
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Create Your Profile',
    description: 'Sign up free. Add your name, bio, photos, and performance videos in minutes.',
  },
  {
    step: 2,
    title: 'Share Your Link',
    description: 'Get your personal portfolio URL. Share it on WhatsApp, Instagram bio, or visiting cards.',
  },
  {
    step: 3,
    title: 'Get Bookings',
    description: 'Clients find you, check your availability, and send inquiries. You close the deal.',
  },
];

interface LandingPricingPlan {
  name: string;
  price: number;
  strike_price?: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
}

const PRICING: LandingPricingPlan[] = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect to get started',
    features: [
      '5 video showcases',
      '10 photo gallery',
      '3 service packages',
      'Basic calendar',
      'Inquiry form',
      'WhatsApp button',
      'Directory listing',
      'StageHost subdomain',
    ],
    cta: 'Start Free',
    href: '/register',
    popular: false,
  },
  {
    name: 'Starter',
    price: 199,
    period: '/month',
    description: 'For growing anchors',
    features: [
      '15 video showcases',
      '30 photo gallery',
      '5 service packages',
      'Lead tracking',
      'Remove footer branding',
      'Basic analytics',
      '3 theme choices',
      'Priority support',
    ],
    cta: 'Upgrade to Starter',
    href: '/register?plan=starter',
    popular: false,
  },
  {
    name: 'Pro',
    price: 599,
    period: '/month',
    description: 'For serious professionals',
    features: [
      'Unlimited videos & photos',
      'Unlimited packages',
      'Google Drive integration',
      'Travel buffer scheduling',
      'Advanced analytics',
      'All themes unlocked',
      'SEO tools',
      'Priority directory listing',
    ],
    cta: 'Go Pro',
    href: '/register?plan=pro',
    popular: true,
  },
  {
    name: 'Premium',
    price: 1299,
    period: '/month',
    description: 'For top-tier anchors',
    features: [
      'Everything in Pro',
      'Custom domain',
      'White-label (no branding)',
      'Featured in directory',
      'Invoice generation',
      'Google Calendar sync',
      'Custom brand colors',
      'Dedicated support',
    ],
    cta: 'Go Premium',
    href: '/register?plan=premium',
    popular: false,
  },
];

const FAQS = [
  {
    question: 'Is it really free to start?',
    answer:
      'Yes! The free plan gives you a full portfolio website with video showcase, photo gallery, schedule management, and inquiry form. No credit card required. You can upgrade anytime as your career grows.',
  },
  {
    question: 'Can I use my own domain name?',
    answer:
      'Yes! With the Premium plan, you can connect your own custom domain (like yourname.com). Free and Starter plans use a StageHost subdomain (yourname.stagehost.in) which still looks professional.',
  },
  {
    question: 'How do clients find me?',
    answer:
      'You get a personal portfolio link to share on WhatsApp, Instagram, visiting cards, etc. Plus, you\'re listed in our public Anchor Directory where clients can search by city, event type, and more.',
  },
  {
    question: 'Do you take a commission on my bookings?',
    answer:
      'No, never! StageHost is a SaaS platform — you pay a flat monthly fee (or use free forever). We don\'t take any commission on your bookings. 100% of your earnings are yours.',
  },
  {
    question: 'Can I manage multiple events on the same day?',
    answer:
      'Absolutely! Our schedule manager supports morning and evening slots per day. You can have a morning wedding and an evening sangeet — the calendar handles it beautifully.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept UPI, credit/debit cards, net banking, and wallets via Razorpay — India\'s most trusted payment gateway. All transactions are secure and GST-compliant.',
  },
];

const SOCIAL_PROOF_STATS = [
  { value: '10,000+', label: 'Anchors Trust Us' },
  { value: '₹50Cr+', label: 'Bookings Generated' },
  { value: '50+', label: 'Cities Covered' },
  { value: '4.9★', label: 'User Rating' },
];


import type { PublicPlan } from '@/lib/actions/plans';

/* =============================================
   LANDING PAGE COMPONENT
   ============================================= */
export function LandingPage({ initialPlans }: { initialPlans?: PublicPlan[] }) {
  const containerRef = useScrollRevealContainer<HTMLDivElement>();

  const pricingPlans = initialPlans && initialPlans.length > 0
    ? initialPlans.map((p) => ({
        name: p.name,
        price: p.price_monthly,
        strike_price: p.strike_price,
        period: p.period_text || (p.price_monthly === 0 ? 'forever' : '/month'),
        description: p.description,
        features: p.features,
        cta: p.cta,
        href: p.href,
        popular: p.popular,
      }))
    : PRICING;

  return (
    <div ref={containerRef}>
      {/* ---- HERO (Attention) ---- */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} />
            <span>The #1 Platform for Event Anchors in India</span>
          </div>

          <h1 className={styles.heroTitle}>
            Your Stage.<br />
            <span className={styles.heroGradient}>Your Brand.</span><br />
            Your Bookings.
          </h1>

          <p className={styles.heroSubtitle}>
            Build a stunning portfolio website, manage your schedule, and convert
            more clients — all from one powerful platform. Free to start.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/register" className="btn btn-accent btn-xl">
              Build Your Portfolio Free
              <ArrowRight size={20} />
            </Link>
            <Link href="/features" className="btn btn-ghost btn-xl">
              Explore Features
            </Link>
          </div>

          <div className={styles.heroTrust}>
            <div className={styles.heroAvatars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.heroAvatar}>
                  {['R', 'P', 'A', 'S', 'M'][i - 1]}
                </div>
              ))}
            </div>
            <p className={styles.heroTrustText}>
              <strong>7500+ anchors</strong> already building their brand
            </p>
          </div>
        </div>

        {/* Hero Mockup Preview */}
        <div className={styles.heroMockup}>
          <div className={styles.mockupPhone}>
            <div className={styles.mockupScreen}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupAvatar}>RS</div>
                <div>
                  <div className={styles.mockupName}>Rahul Sharma</div>
                  <div className={styles.mockupTagline}>Premium Wedding & Corporate Anchor</div>
                </div>
              </div>
              <div className={styles.mockupVideoThumb}>
                <Video size={32} />
                <span>Watch My Best Performance</span>
              </div>
              <div className={styles.mockupStats}>
                <div className={styles.mockupStat}>
                  <span className={styles.mockupStatValue}>150+</span>
                  <span className={styles.mockupStatLabel}>Events</span>
                </div>
                <div className={styles.mockupStat}>
                  <span className={styles.mockupStatValue}>4.9★</span>
                  <span className={styles.mockupStatLabel}>Rating</span>
                </div>
                <div className={styles.mockupStat}>
                  <span className={styles.mockupStatValue}>8+</span>
                  <span className={styles.mockupStatLabel}>Years</span>
                </div>
              </div>
              <div className={styles.mockupCta}>
                <div className={styles.mockupBtn}>Book Now</div>
                <div className={styles.mockupBtnWa}>WhatsApp</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- SOCIAL PROOF BAR ---- */}
      <section className={styles.socialProof}>
        <div className={styles.socialProofGrid}>
          {SOCIAL_PROOF_STATS.map((stat) => (
            <div key={stat.label} className={styles.socialProofItem}>
              <span className={styles.socialProofValue}>{stat.value}</span>
              <span className={styles.socialProofLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---- FEATURES (Interest) ---- */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-primary reveal">Features</span>
          <h2 className="reveal reveal-delay-1">
            Everything You Need to<br />
            <span className={styles.heroGradient}>Grow Your Career</span>
          </h2>
          <p className="reveal reveal-delay-2">
            From portfolio building to schedule management — one platform that does it all.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`card card-interactive reveal reveal-delay-${Math.min(i + 1, 4)}`}
            >
              <div className={styles.featureIcon}>
                <feature.icon size={24} />
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- HOW IT WORKS (Interest + Desire) ---- */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-accent reveal">How It Works</span>
          <h2 className="reveal reveal-delay-1">
            Go Live in<br />
            <span className={styles.heroGradient}>3 Simple Steps</span>
          </h2>
        </div>

        <div className={styles.stepsGrid}>
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className={`${styles.step} reveal`}>
              <div className={styles.stepNumber}>{step.step}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- TRUST SECTION (Desire) ---- */}
      <section className={styles.trustSection}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-success reveal">Why StageHost?</span>
          <h2 className="reveal reveal-delay-1">
            Built for Anchors,<br />
            <span className={styles.heroGradient}>Not Marketplaces</span>
          </h2>
        </div>

        <div className={styles.trustGrid}>
          <div className={`${styles.trustCard} reveal`}>
            <Shield size={28} color="var(--color-success)" />
            <h4>No Commission, Ever</h4>
            <p>We never take a cut from your bookings. Your earnings are 100% yours.</p>
          </div>
          <div className={`${styles.trustCard} reveal reveal-delay-1`}>
            <Zap size={28} color="var(--color-accent)" />
            <h4>Your Brand, Not Ours</h4>
            <p>Unlike marketplaces where you compete with 100 others, clients see only YOU.</p>
          </div>
          <div className={`${styles.trustCard} reveal reveal-delay-2`}>
            <Users size={28} color="var(--color-primary)" />
            <h4>Built for India</h4>
            <p>UPI payments, WhatsApp integration, and designed for the Indian events industry.</p>
          </div>
          <div className={`${styles.trustCard} reveal reveal-delay-3`}>
            <Star size={28} color="var(--color-warning)" />
            <h4>Premium Design</h4>
            <p>Your portfolio looks like a website that cost ₹50,000 to build. For free.</p>
          </div>
        </div>
      </section>

      {/* ---- PRICING (Action) ---- */}
      <section id="pricing" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-accent reveal">Pricing</span>
          <h2 className="reveal reveal-delay-1">
            Start Free,<br />
            <span className={styles.heroGradient}>Scale as You Grow</span>
          </h2>
          <p className="reveal reveal-delay-2">
            No hidden fees. No commission. Simple, transparent pricing.
          </p>
        </div>

        <div className={styles.pricingGrid} data-count={pricingPlans.length}>
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`${styles.pricingCard} ${plan.popular ? styles.pricingPopular : ''} reveal`}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>Most Popular</div>
              )}
              <div className={styles.pricingName}>{plan.name}</div>
              <div className={styles.pricingPrice}>
                {plan.price === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    {plan.strike_price && plan.strike_price > 0 && (
                      <span
                        style={{
                          textDecoration: 'line-through',
                          color: 'var(--color-text-tertiary)',
                          fontSize: '18px',
                          fontWeight: 600,
                        }}
                      >
                        ₹{plan.strike_price}
                      </span>
                    )}
                    <span className={styles.pricingAmount}>Free</span>
                    {plan.period && (
                      <span className={styles.pricingPeriod}>{plan.period}</span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    {plan.strike_price && plan.strike_price > plan.price && (
                      <span
                        style={{
                          textDecoration: 'line-through',
                          color: 'var(--color-text-tertiary)',
                          fontSize: '18px',
                          fontWeight: 600,
                        }}
                      >
                        ₹{plan.strike_price}
                      </span>
                    )}
                    <div style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                      <span className={styles.pricingCurrency}>₹</span>
                      <span className={styles.pricingAmount}>{plan.price}</span>
                      <span className={styles.pricingPeriod}>{plan.period}</span>
                    </div>
                  </div>
                )}
              </div>
              <p className={styles.pricingDesc}>{plan.description}</p>
              <ul className={styles.pricingFeatures}>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} color="var(--color-success)" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`btn btn-block ${plan.popular ? 'btn-accent' : 'btn-ghost'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-ghost reveal">FAQ</span>
          <h2 className="reveal reveal-delay-1">
            Frequently Asked<br />
            <span className={styles.heroGradient}>Questions</span>
          </h2>
        </div>

        <div className={styles.faqList}>
          {FAQS.map((faq) => (
            <div key={faq.question} className="reveal">
              <FaqItem question={faq.question} answer={faq.answer} />
            </div>
          ))}
        </div>
      </section>

      {/* ---- FINAL CTA ---- */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaGlow} />
        <h2 className="reveal">
          Ready to Build Your<br />
          <span className={styles.heroGradient}>Digital Stage?</span>
        </h2>
        <p className="reveal reveal-delay-1">
          Join hundreds of anchors who are already growing their career with StageHost.
          Free forever. No credit card required.
        </p>
        <Link href="/register" className="btn btn-accent btn-xl reveal reveal-delay-2">
          Get Started Free
          <ArrowRight size={20} />
        </Link>
      </section>
    </div>
  );
}


/* ---- FAQ Item Component ---- */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}>
      <button
        type="button"
        className={styles.faqQuestion}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <ChevronDown
          size={20}
          className={styles.faqChevron}
        />
      </button>
      <div className={styles.faqAnswer}>
        <p>{answer}</p>
      </div>
    </div>
  );
}
