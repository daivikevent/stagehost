import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Globe,
  MessageCircle,
  Video,
  Star,
  Calendar,
  FileDown,
  BarChart3,
  ShieldCheck,
  Zap,
  Award,
  Film,
  Clock,
  CreditCard,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import styles from '@/components/marketing/AboutPage.module.css';

export const metadata = {
  title: 'Platform Features',
  description: 'Explore the complete feature suite of StageHost: custom portfolios, video showreels, verified reviews, and WhatsApp booking tools.',
};

const FEATURES = [
  {
    icon: Clock,
    title: 'Pencil Hold Expiry Timer & Auto-Nudge',
    desc: 'Prevent non-committal organizers from freezing your prime dates. Choose 24h/48h/72h/7d expiry countdowns or manual holds with 1-click polite WhatsApp reminder messages.',
  },
  {
    icon: AlertCircle,
    title: 'Date Collision & Dual-Inquiry Engine',
    desc: 'Instant collision alerts when a new inquiry conflicts with a confirmed show or existing pencil hold. Leverage inbound inquiries to lock in token deposits.',
  },
  {
    icon: CreditCard,
    title: 'Razorpay Advance Token Checkout',
    desc: 'Clients can lock in tentative holds online directly on public digital receipts (/receipt/[id]) via UPI, Cards, or Netbanking. Auto-converts to Confirmed Shows.',
  },
  {
    icon: FileCheck,
    title: 'Offline Backstage PWA & Legal Contract with E-Sign',
    desc: 'Access cue sheets and schedules in zero-network ballroom basements via PWA offline caching. Generate 7-clause legal performance agreements with digital E-Sign seals.',
  },
  {
    icon: Calendar,
    title: '1-Click Direct Google Calendar Sync',
    desc: 'Create pre-filled Google Calendar events with 1 click from any show card. Subscribe in Google Calendar or Apple Calendar with live WebCal (.ics) feeds.',
  },
  {
    icon: Globe,
    title: 'Branded Digital Stage URL',
    desc: 'Get your official personal portfolio URL (stagehost.in/your-name). Mobile-first, blazingly fast, and designed to look stunning on any screen size.',
  },
  {
    icon: Award,
    title: 'Gigs & Stage Milestone Counter',
    desc: 'Display verified stage experience (e.g. 350+, 650+ Shows) in your public Credibility Bar and Bento Grid to build instant trust with premium event planners.',
  },
  {
    icon: Film,
    title: 'Multi-Source Video Player',
    desc: 'Showcase your mic skills with YouTube, Instagram Reels, and direct Google Drive video links with instant playback and zero lag.',
  },
  {
    icon: MessageCircle,
    title: 'Direct WhatsApp Inquiries',
    desc: 'Clients can book you directly with pre-filled event specs (date, city, budget). Zero platform commissions—keep 100% of your earnings.',
  },
  {
    icon: Video,
    title: 'Categorized Video Showreels',
    desc: 'Organize your stage performances by event type (Weddings, Corporate, College Fests, Sangeet). Embed YouTube, Vimeo, or upload videos directly.',
  },
  {
    icon: Star,
    title: 'Verified Client Reviews',
    desc: 'Collect authentic client ratings and testimonials with verified phone and event badges. Build unbeatable social proof for corporate event planners.',
  },
  {
    icon: FileDown,
    title: '1-Click PDF Profile Generator',
    desc: 'Instantly download or send high-resolution, print-ready PDF profiles with your bio, photo, past clients, and contact info to event agencies.',
  },
  {
    icon: BarChart3,
    title: 'Visitor & Lead Analytics',
    desc: 'Track who viewed your portfolio, how many clicked your WhatsApp button, and which city your inquiries are originating from.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Artist Badge',
    desc: 'Stand out from amateur hosts with an official StageHost Verified Emcee checkmark on your portfolio and directory listing.',
  },
];

export default function FeaturesPage() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.badge}>
          <Sparkles size={14} /> Comprehensive Feature Suite
        </div>
        <h1 className={styles.headline}>
          Everything You Need to Run Your <span className={styles.headlineGradient}>Anchor Career</span>
        </h1>
        <p className={styles.subtitle}>
          StageHost replaces messy Google Drives, heavy PDFs, and scattered Instagram DMs with one sleek, high-converting digital command center.
        </p>
      </div>

      {/* Feature Grid */}
      <div className={styles.valuesGrid} style={{ marginBottom: 64 }}>
        {FEATURES.map((feat, i) => (
          <div key={i} className={styles.valueCard} style={{ padding: '28px 24px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(245, 166, 35, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-accent)',
                  flexShrink: 0,
                }}
              >
                <feat.icon size={20} />
              </div>
              {feat.title}
            </h4>
            <p style={{ marginTop: 8, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
              {feat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <h2>Experience the Difference Today</h2>
        <p>
          Set up your complete digital portfolio in under 3 minutes. Completely free forever with no credit card required.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-accent btn-lg">
            Build Your Portfolio Free <ArrowRight size={18} />
          </Link>
          <Link href="/pricing" className="btn btn-ghost btn-lg">
            View Pricing Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
