/* ============================================
   StageHost — Platform Documentation & User Guide
   Auto-updating Feature Registry & Interactive Knowledge Base
   ============================================ */

export interface DocStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  actionUrl?: string;
  actionText?: string;
  highlights: string[];
  role: 'anchor' | 'client' | 'admin' | 'all';
}

export interface PlatformFeature {
  id: string;
  title: string;
  category: 'anchor' | 'client' | 'admin' | 'platform';
  tier: 'Free' | 'Starter' | 'Pro' | 'Premium' | 'All Plans';
  status: 'Live' | 'New' | 'Updated';
  version: string;
  lastUpdated: string;
  summary: string;
  howToUse: string[];
  iconName: string;
  tags: string[];
}

export interface DocCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  steps: DocStep[];
}

// ---- Master Step-by-Step User Guides ----
export const PLATFORM_DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started & Onboarding',
    description: 'Learn how to create your profile and claim your official clean stage link in under 3 minutes.',
    iconName: 'Sparkles',
    steps: [
      {
        stepNumber: 1,
        title: 'Sign Up & Claim Your Stage URL',
        subtitle: 'Get clean links like stagehost.in/your-name',
        description:
          'Create your free account. Choose your stage name and claim a clean, professional public URL without random hex codes or clutter.',
        actionUrl: '/register',
        actionText: 'Create Free Account',
        highlights: [
          'Instant verification via Supabase Auth',
          'Clean vanity URL (e.g. stagehost.in/amit-joshi)',
          'Permanent link for your Instagram bio and business card',
        ],
        role: 'anchor',
      },
      {
        stepNumber: 2,
        title: 'Complete 5-Minute Visual Onboarding',
        subtitle: 'Add photo, bio, languages and primary cities',
        description:
          'Upload your best high-resolution stage portrait. Specify the event genres you specialize in (Weddings, Corporate, College Festivals, Sangeet) and the languages you speak fluently.',
        actionUrl: '/onboarding',
        actionText: 'Go to Onboarding',
        highlights: [
          'Supports 15+ Indian languages and 30+ major cities',
          'Clear taglines that immediately communicate your niche',
          'Responsive crop that looks gorgeous on mobile and desktop',
        ],
        role: 'anchor',
      },
      {
        stepNumber: 3,
        title: 'Preview & Share Your Portfolio',
        subtitle: 'Test how your portfolio looks to clients',
        description:
          'Click "View Portfolio" in your dashboard sidebar to inspect your public stage. Copy your link with one click to share across WhatsApp and client pitches.',
        highlights: [
          'Built-in QR code generator and 1-click share modal',
          'Blazingly fast loading with zero lag for event organizers',
          '100% responsive for iOS, Android, and tablets',
        ],
        role: 'anchor',
      },
    ],
  },
  {
    id: 'anchors-guide',
    title: 'Anchor & Emcee User Guide',
    description: 'Master showreels, calendar booking, pricing packages, themes, and lead conversions.',
    iconName: 'Mic',
    steps: [
      {
        stepNumber: 1,
        title: 'Add Video Showreels & Media',
        subtitle: 'Embed YouTube, Instagram, Facebook & Google Drive',
        description:
          'Showcase your actual microphone skills. Paste video links from YouTube (including Shorts), Instagram Reels, Facebook Watch, or Google Drive. Organize them by event category.',
        actionUrl: '/media',
        actionText: 'Manage Videos & Photos',
        highlights: [
          'Automatic YouTube thumbnail detection and player embedding',
          'Categorize videos into Weddings, Corporate, and College shows',
          'Add photo gallery for stage costumes and celebrity moments',
        ],
        role: 'anchor',
      },
      {
        stepNumber: 2,
        title: 'Setup Packages & Pricing',
        subtitle: 'Set transparent packages in Indian Rupees (INR)',
        description:
          'Create customized service packages (e.g., "Full Wedding 2-Day Host", "Corporate Awards Evening", "Sangeet Special"). Detail what is included and your starting fee.',
        actionUrl: '/services',
        actionText: 'Manage Packages',
        highlights: [
          'Eliminates repetitive pricing questions from prospective clients',
          'Display duration, rehearsal inclusions, and equipment info',
          'Badge popular or recommended packages',
        ],
        role: 'anchor',
      },
      {
        stepNumber: 3,
        title: 'Manage Live Availability & Calendar',
        subtitle: 'Show open slots, booked dates and travel days',
        description:
          'Keep your schedule up to date. Mark dates as Available, Booked, or Travel Day. Choose between Morning, Evening, or Full Day slots to prevent double-booking.',
        actionUrl: '/schedule',
        actionText: 'Manage Schedule',
        highlights: [
          'Prevents organizers from inquiring for dates you are already booked',
          'Travel buffer days notify clients you are out of town',
          'Real-time sync to your public calendar widget',
        ],
        role: 'anchor',
      },
      {
        stepNumber: 4,
        title: 'Receive Direct WhatsApp Inquiries',
        subtitle: '100% commission-free client bookings',
        description:
          'When clients visit your portfolio, they can send an instant inquiry form or click your WhatsApp button. The message arrives with event date, city, and budget already filled in.',
        actionUrl: '/inquiries',
        actionText: 'View Inquiries',
        highlights: [
          'Pre-formatted WhatsApp message with all event details',
          'Inquiries dashboard tracks status: New, Contacted, Converted, Lost',
          'Zero commissions taken by StageHost—you keep 100% of your fee',
        ],
        role: 'anchor',
      },
      {
        stepNumber: 5,
        title: 'Choose Visual Architecture & Layout',
        subtitle: 'Select from 3 high-impact luxury layouts',
        description:
          'Switch your public profile architecture between Vogue Editorial (high-fashion typography with cinematic split-screen), Neo-Stage Cyber (futuristic HUD with holographic metrics), and Classic Bento Grid.',
        actionUrl: '/portfolio',
        actionText: 'Customize Layout',
        highlights: [
          'Instant preview directly on your live portfolio link',
          'Tailored for celebrity weddings, arena concerts, and corporate summits',
          'Changes save instantly to your live public stage',
        ],
        role: 'anchor',
      },
      {
        stepNumber: 6,
        title: 'Connect Custom Domain (e.g. anchorname.live)',
        subtitle: 'Brand your stage with your own domain',
        description:
          'Premium users can connect their own domain. Simply enter your domain in Settings and add a CNAME record pointing to cname.stagehost.in. SSL is provisioned automatically.',
        actionUrl: '/settings',
        actionText: 'Domain Settings',
        highlights: [
          'Automatic Let\'s Encrypt wildcard SSL certificate',
          'Seamless DNS verification with CNAME or A-record',
          'Preserves your personal brand while powered by StageHost engine',
        ],
        role: 'anchor',
      },
    ],
  },
  {
    id: 'planners-guide',
    title: 'Event Planners & Clients Guide',
    description: 'How corporate organizers, wedding planners, and agencies find and book top talent.',
    iconName: 'CalendarCheck',
    steps: [
      {
        stepNumber: 1,
        title: 'Browse the Anchor Directory',
        subtitle: 'Filter by city, genre, language, and budget',
        description:
          'Discover verified professional emcees across Mumbai, Delhi, Bengaluru, Jaipur, Pune, and all across India. Filter by your specific event criteria with zero login required.',
        actionUrl: '/directory',
        actionText: 'Explore Directory',
        highlights: [
          'Search by anchor name, city, or event specialty',
          'Filter by minimum and maximum budget ranges',
          'Multi-language filtering for bilingual and multilingual events',
        ],
        role: 'client',
      },
      {
        stepNumber: 2,
        title: 'Check Spotlight & Verified Badges',
        subtitle: 'Identify trusted, experienced stage hosts',
        description:
          'Look for the blue "Verified" checkmark and the golden "Spotlight" badge indicating top-rated, proven emcees with verified event track records.',
        highlights: [
          'Verified badges ensure genuine contact details and real anchors',
          'Read authentic past client testimonials and ratings',
          'Watch actual stage video showreels before reaching out',
        ],
        role: 'client',
      },
      {
        stepNumber: 3,
        title: 'Check Live Availability & Send Inquiry',
        subtitle: 'Instant response via WhatsApp or in-app form',
        description:
          'View the anchor\'s live calendar to confirm they are free on your event date. Submit the inquiry form or click "Chat on WhatsApp" to connect directly with the emcee.',
        highlights: [
          'Pre-filled event details save time and prevent back-and-forth',
          'Direct communication with the artist—no broker or agent markup',
          'Fast response times guaranteed by direct mobile notifications',
        ],
        role: 'client',
      },
    ],
  },
  {
    id: 'admin-guide',
    title: 'Platform Management & Master Admin',
    description: 'Master platform controls, global website theme switcher, plans and page CMS.',
    iconName: 'Shield',
    steps: [
      {
        stepNumber: 1,
        title: 'Global Website Theme Switcher',
        subtitle: 'Switch master appearance across the entire website',
        description:
          'Administrators can switch the entire website\'s aesthetic with one click in Admin > Themes. Choose from 5 curated Modern and Royal themes (Obsidian Violet, Midnight Royal Gold, Royal Emerald, Imperial Sapphire, Crimson Velvet).',
        actionUrl: '/admin/themes',
        actionText: 'Open Theme Studio',
        highlights: [
          'Instant live preview before applying to the public',
          'Persists to platform_settings and sets zero-latency server cookies',
          'Changes all navigation, hero, cards, badges, and buttons site-wide',
        ],
        role: 'admin',
      },
      {
        stepNumber: 2,
        title: 'Dynamic Plans & Pricing CMS',
        subtitle: 'Manage subscription tiers and pricing limits',
        description:
          'Update subscription plans (Free, Starter, Pro, Premium) and monthly/annual pricing in Admin > Plans. Changes automatically sync to the public /pricing page and homepage.',
        actionUrl: '/admin/plans',
        actionText: 'Manage Plans',
        highlights: [
          'Toggle plan active status or modify feature limits',
          'Automatic 20% annual discount calculation and badge support',
          'Instant layout cache revalidation',
        ],
        role: 'admin',
      },
      {
        stepNumber: 3,
        title: 'Legal & Pages CMS',
        subtitle: 'Edit Terms, Privacy, About, and Docs in real-time',
        description:
          'Edit public pages and legal documentation directly from Admin > Pages & Legal CMS without touching source code or redeploying.',
        actionUrl: '/admin/pages',
        actionText: 'Open Pages CMS',
        highlights: [
          'Visual editors for sections, summaries, and contact info',
          'Instant database storage in platform_settings',
          'Automatic revalidation across all public routes',
        ],
        role: 'admin',
      },
    ],
  },
];

// ---- Master Dynamic Feature Registry (Auto-Updating) ----
// ANY NEW FEATURE ADDED TO STAGEHOST SHOULD BE REGISTERED HERE!
export const PLATFORM_FEATURES_REGISTRY: PlatformFeature[] = [
  {
    id: 'hold-expiry-nudge-system',
    title: 'Pencil Hold Expiry Timer & Smart WhatsApp Nudge',
    category: 'anchor',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.8',
    lastUpdated: 'September 2026',
    summary:
      'Prevent date lockouts from non-committal clients with optional auto-expiring holds (24h, 48h, 72h, 7d, or Custom) alongside default zero-timer Manual Hold mode and 1-click WhatsApp polite nudge reminders.',
    howToUse: [
      'Go to Dashboard > Schedule and click "+ Add Booking".',
      'Select "🟡 Pencil Hold (Tentative)" — by default it starts in "None (Manual Hold)" mode with zero countdown timers.',
      'Optionally pick a hold duration (24h, 48h, 72h, 7d, or Custom Datetime with quick +12h / +5 Days offset shortcuts).',
      'Active holds appear in the top amber alert banner. Click "⚡ Nudge via WhatsApp" to send a pre-formatted professional reminder.',
      'Click the direct "Edit" button inside the Active Holds modal to update show details instantly without extra clicks.',
    ],
    iconName: 'Clock',
    tags: ['Pencil Hold', 'Expiry Timer', 'WhatsApp Nudge', 'Schedule', 'Pipeline'],
  },
  {
    id: 'date-clash-dual-inquiry-engine',
    title: 'Date Clash & Dual-Inquiry Detection Engine',
    category: 'anchor',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.8',
    lastUpdated: 'September 2026',
    summary:
      'Real-time schedule collision engine that alerts you when an inbound inquiry clashes with a confirmed show or existing pencil hold, giving you instant negotiation leverage.',
    howToUse: [
      'Navigate to Dashboard > Inquiries.',
      'System flags collisions with "⚔️ Booked Clash" (if show is confirmed) or "⚡ Hold Clash" (if tentatively held).',
      'Click on any clashing inquiry to open the detail panel featuring the Clash Management & Leverage box.',
      'Click "⚡ WhatsApp Hold Client" to ask the hold client for an advance deposit before giving the date away.',
      'Click "💬 Reply to New Client" to suggest alternate open dates or morning/evening slots.',
    ],
    iconName: 'AlertCircle',
    tags: ['Clash Detection', 'Dual Inquiry', 'Negotiation', 'Leverage', 'Inquiries'],
  },
  {
    id: 'razorpay-advance-token-payment',
    title: 'Razorpay Advance Token Payment on Public Receipt',
    category: 'anchor',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.8',
    lastUpdated: 'September 2026',
    summary:
      'Instant online payment checkout on public digital receipts (/receipt/[id]) via UPI, Cards, and Netbanking. Automatically converts pencil holds to Confirmed Shows upon successful payment.',
    howToUse: [
      'Open any booking receipt in Schedule by clicking the Receipt icon.',
      'Set an advance deposit amount or let the client select token presets (₹10k, ₹15k, ₹25k, or custom).',
      'Share the live /receipt/[id] link with your client.',
      'Client clicks "Pay Token Online" and completes payment via Razorpay UPI / Cards.',
      'StageHost instantly marks payment verified, updates the slot to "booked", and converts the hold to Confirmed.',
    ],
    iconName: 'CreditCard',
    tags: ['Razorpay', 'UPI', 'Token Payment', 'Advance', 'Receipt', 'Automation'],
  },
  {
    id: 'direct-google-cal-sync',
    title: '1-Click Direct Google Calendar Sync & WebCal Feed',
    category: 'anchor',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.8',
    lastUpdated: 'September 2026',
    summary:
      'Direct 1-click Google Calendar event creation for any show, plus instant 1-click WebCal subscription links for Google Calendar and Apple Calendar.',
    howToUse: [
      'On any show card in Schedule, click the "📅 Cal" button to open a pre-filled Google Calendar event with venue, client contact, timings, and cue notes.',
      'Click "Sync Cal" in the top header to open the Calendar Sync modal.',
      'Click "Subscribe in Google Calendar" or "Subscribe in Apple Calendar" to sync all future shows automatically in real-time.',
    ],
    iconName: 'Calendar',
    tags: ['Google Calendar', 'Apple Calendar', 'iCal', 'WebCal', 'Sync'],
  },
  {
    id: 'offline-backstage-pwa-contract',
    title: 'Offline Backstage PWA & Legal Performance Contract',
    category: 'anchor',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.8',
    lastUpdated: 'September 2026',
    summary:
      'Progressive Web App (PWA) with service worker offline caching for zero-network ballrooms, plus printable 7-clause Artist Performance Engagement Agreement with digital E-Sign.',
    howToUse: [
      'Install StageHost as an app on your phone or home screen via browser prompt (PWA manifest & service worker enabled).',
      'Access show schedules, receipts, and cue sheets even in basement venues with zero cellular reception.',
      'On any receipt page, toggle to "Legal Performance Contract" view.',
      'Generates a formal legal contract with technical rider, payment milestones, cancellation clauses, and e-signature seal ready to print or save as PDF.',
    ],
    iconName: 'FileCheck',
    tags: ['PWA', 'Offline', 'Legal Contract', 'E-Sign', 'Agreement', 'PDF'],
  },
  {
    id: 'screen-fit-view-switcher',
    title: '1-Screen Fit Switcher & Executive Header Action Bar',
    category: 'anchor',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.8',
    lastUpdated: 'September 2026',
    summary:
      'Switch seamlessly between Calendar View and Shows Pipeline without 1000px vertical scrolling. Redesigned executive single-row action toolbar.',
    howToUse: [
      'In Dashboard > Schedule, use the top switcher: "Calendar View", "Shows Pipeline", or "All-in-One".',
      'Click "Shows Pipeline" to view all confirmed and held shows right at the top of your screen with sticky headers and compact rows.',
      'Use the streamlined top action bar for 1-click Add Booking, Import/Export, Sync Cal, and Portfolio preview without awkward wrapping.',
      'Your view selection is saved automatically in your browser for your next visit.',
    ],
    iconName: 'LayoutGrid',
    tags: ['View Switcher', 'Pipeline', 'Header', 'Compact View', 'UX'],
  },
  {
    id: 'gigs-completed-milestone',
    title: 'Gigs & Stage Shows Milestone Counter',
    category: 'anchor',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.7',
    lastUpdated: 'September 2026',
    summary:
      'Verified counter for completed stage performances (e.g., 350+, 650+ Shows) that displays prominently in the public Credibility Bar and Bento Grid.',
    howToUse: [
      'Go to Dashboard > Edit Portfolio > Basic Information.',
      'Enter your total shows in the "Stage Gigs / Shows Completed" field.',
      'Instant real-time preview shows "XXX+ Shows" in the top credibility bar and public Bento highlight card.',
      'Saves directly to your Supabase profile with zero data loss.',
    ],
    iconName: 'Award',
    tags: ['Gigs', 'Shows', 'Credibility', 'Milestone', 'Bento', 'Trust'],
  },
  {
    id: 'google-drive-video-playback',
    title: 'Native Google Drive Video Embeds',
    category: 'anchor',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.7',
    lastUpdated: 'September 2026',
    summary:
      'Seamless support for Google Drive video showreel links alongside YouTube and Instagram Reels with automatic thumbnail generation.',
    howToUse: [
      'Copy any public share link from your Google Drive performance video.',
      'Navigate to Dashboard > Portfolio > Videos & Media.',
      'Paste the Google Drive URL — StageHost automatically detects the platform and embeds an interactive high-speed video player.',
    ],
    iconName: 'Video',
    tags: ['Google Drive', 'Videos', 'Showreel', 'Embed', 'Media'],
  },
  {
    id: 'ical-calendar-sync',
    title: 'iCalendar (.ics) Live Feed Sync',
    category: 'platform',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.7',
    lastUpdated: 'September 2026',
    summary:
      'Dynamic /api/calendar/[slug] feed allowing anchors and event agencies to subscribe to real-time booking availability in Apple Calendar, Google Calendar, and Outlook.',
    howToUse: [
      'Access your live calendar feed link via /api/calendar/[your-slug].',
      'Add it as a subscription calendar URL in Google Calendar or iOS Calendar.',
      'All booked, travel, and blocked dates sync automatically without manual export.',
    ],
    iconName: 'Calendar',
    tags: ['Calendar', 'iCal', 'Google Calendar', 'Sync', 'Automation'],
  },
  {
    id: 'multi-artist-expansion',
    title: 'Universal Multi-Artist Architecture',
    category: 'platform',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.6',
    lastUpdated: 'September 2026',
    summary:
      'Full architectural expansion supporting 11 distinct artist categories: Emcees, DJs, Live Singers, Musicians, Standup Comedians, Dancers, Magicians, Keynote Speakers, Voiceover Artists, Photographers, and Celebrities.',
    howToUse: [
      'Artists can choose their specific category in Dashboard > Edit Portfolio > Basic Information.',
      'Visitors and event planners can filter talent by category pill tabs directly on /directory.',
      'Includes category-specific badges, taxonomy helpers, and seamless fallback resilience.',
    ],
    iconName: 'Sparkles',
    tags: ['Multi-Artist', 'DJ', 'Singer', 'Comedian', 'Directory', 'Expansion'],
  },
  {
    id: 'global-royal-themes',
    title: 'Global Website Royal Themes',
    category: 'platform',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.5',
    lastUpdated: 'September 2026',
    summary:
      'Master theme switcher in the Admin Panel that transforms the entire platform into 5 modern and royal luxury aesthetics.',
    howToUse: [
      'Log into Admin Panel as administrator (admin@stagehost.com).',
      'Navigate to Admin > Themes or Admin > Platform Settings.',
      'Click "Live Preview" on any theme (Midnight Royal Gold, Royal Emerald, Imperial Sapphire, Crimson Velvet).',
      'Click "Apply to Entire Website" to make it active for all visitors across the globe.',
    ],
    iconName: 'Palette',
    tags: ['Theme', 'Royal Gold', 'Emerald', 'Admin', 'Aesthetics'],
  },
  {
    id: 'dynamic-pricing-sync',
    title: 'Dynamic Database Plans & Pricing',
    category: 'platform',
    tier: 'All Plans',
    status: 'New',
    version: 'v2.4',
    lastUpdated: 'September 2026',
    summary:
      'Public pricing (/pricing and landing page) dynamically syncs with the Supabase plans database with monthly/annual billing toggles.',
    howToUse: [
      'Visit /pricing to view all active plans with 20% annual savings toggle.',
      'Admins can modify prices, features, and limits in Admin > Plans & Pricing.',
      'Edits revalidate immediately on public pages without redeploying code.',
    ],
    iconName: 'CreditCard',
    tags: ['Pricing', 'Plans', 'Subscription', 'Sync'],
  },
  {
    id: 'clean-profile-slugs',
    title: 'Clean Anchor Slugs & Vanity URLs',
    category: 'anchor',
    tier: 'All Plans',
    status: 'Live',
    version: 'v2.3',
    lastUpdated: 'September 2026',
    summary:
      'Anchors get clean vanity URLs like stagehost.in/rahul-sharma without random hex hash suffixes. Legacy URLs automatically redirect.',
    howToUse: [
      'Set your stage name during registration or in Profile Settings.',
      'The system automatically slugifies your name cleanly (e.g. stagehost.in/amit-joshi).',
      'Old URLs with hash suffixes automatically redirect to the clean URL seamlessly.',
    ],
    iconName: 'Link2',
    tags: ['Slug', 'URL', 'Branding', 'SEO'],
  },
  {
    id: 'collapsible-admin-navbar',
    title: 'Collapsible Admin Sidebar Navigation',
    category: 'admin',
    tier: 'All Plans',
    status: 'Live',
    version: 'v2.3',
    lastUpdated: 'September 2026',
    summary:
      'Admin navigation sidebar expands and collapses between 240px and 68px icon-only mode with tooltips and fluid width tables.',
    howToUse: [
      'Open any Admin page (/admin/dashboard, /admin/users, /admin/themes, etc.).',
      'Click the chevron arrow next to the logo to collapse or expand the sidebar.',
      'Wide tables utilize 100% fluid screen width with smooth horizontal scrolling.',
    ],
    iconName: 'Sidebar',
    tags: ['Admin', 'UI', 'Navbar', 'Responsiveness'],
  },
  {
    id: 'admin-direct-link',
    title: 'Dashboard Admin Panel Quick Link',
    category: 'admin',
    tier: 'All Plans',
    status: 'Live',
    version: 'v2.2',
    lastUpdated: 'September 2026',
    summary:
      'For authenticated admin users, a direct "Admin Panel" tab appears in the anchor dashboard sidebar right above "View Portfolio".',
    howToUse: [
      'Log in with an administrator account (admin@stagehost.com).',
      'Visit /dashboard.',
      'Look at the bottom sidebar footer to find the golden "Admin Panel" button.',
    ],
    iconName: 'ShieldCheck',
    tags: ['Admin', 'Shortcut', 'Navigation'],
  },
  {
    id: 'whatsapp-direct-booking',
    title: 'Instant WhatsApp Booking Inquiries',
    category: 'anchor',
    tier: 'All Plans',
    status: 'Live',
    version: 'v2.0',
    lastUpdated: 'August 2026',
    summary:
      'Clients can initiate WhatsApp chats with pre-filled event specs (date, city, event type, budget). Zero commissions deducted.',
    howToUse: [
      'Anchors add their WhatsApp number in Profile Settings.',
      'Clients click "Chat on WhatsApp" on the public profile.',
      'WhatsApp opens with a ready-to-send structured booking request.',
    ],
    iconName: 'MessageCircle',
    tags: ['WhatsApp', 'Booking', 'Zero Commission', 'Leads'],
  },
  {
    id: 'multichannel-video-embeds',
    title: 'Multichannel Video Embeds (YouTube, Insta, GDrive)',
    category: 'anchor',
    tier: 'All Plans',
    status: 'Live',
    version: 'v2.1',
    lastUpdated: 'August 2026',
    summary:
      'Showcase video performances from YouTube (regular & shorts), Instagram Reels, Facebook, and Google Drive links.',
    howToUse: [
      'Go to Dashboard > Media.',
      'Click "Add Video", select platform, paste link, and enter event title.',
      'Videos appear in categorised showreel tabs on your public portfolio.',
    ],
    iconName: 'Video',
    tags: ['Media', 'Showreel', 'YouTube', 'Instagram', 'Google Drive'],
  },
  {
    id: 'live-booking-calendar',
    title: 'Real-Time Availability Calendar Widget',
    category: 'anchor',
    tier: 'Starter',
    status: 'Live',
    version: 'v2.0',
    lastUpdated: 'August 2026',
    summary:
      'Interactive month calendar widget showing booked dates, available morning/evening slots, and travel buffer days.',
    howToUse: [
      'Go to Dashboard > Schedule.',
      'Click on any calendar day to mark it Available, Booked, or Travel Day.',
      'Public visitors see availability in real-time on your profile calendar.',
    ],
    iconName: 'Calendar',
    tags: ['Schedule', 'Calendar', 'Availability', 'Travel Buffer'],
  },
  {
    id: 'custom-domains-dns',
    title: 'Custom Domain & DNS Integration',
    category: 'anchor',
    tier: 'Premium',
    status: 'Live',
    version: 'v2.2',
    lastUpdated: 'September 2026',
    summary:
      'Connect custom apex and subdomains (e.g. anchorname.live) with automated wildcard SSL certificates and DNS verification.',
    howToUse: [
      'Go to Dashboard > Settings > Custom Domain.',
      'Enter your domain name (e.g. myname.live).',
      'Create a CNAME DNS record pointing to cname.stagehost.in in your registrar.',
      'Admin approves the domain in Admin > Platform Settings.',
    ],
    iconName: 'Globe',
    tags: ['Custom Domain', 'DNS', 'CNAME', 'SSL'],
  },
  {
    id: 'directory-spotlight-badges',
    title: 'Directory Spotlight & Verified Badges',
    category: 'client',
    tier: 'Pro',
    status: 'Live',
    version: 'v2.3',
    lastUpdated: 'September 2026',
    summary:
      'Top-rated anchors get featured with Spotlight badges and verified blue checkmarks in the public directory.',
    howToUse: [
      'Admins toggle Spotlight and Verified status in Admin > Users & Anchors.',
      'Featured anchors appear with gold badges and higher directory ranking.',
    ],
    iconName: 'Star',
    tags: ['Directory', 'Spotlight', 'Verified', 'Search'],
  },
  {
    id: 'pages-legal-cms',
    title: 'Real-Time Legal & Content CMS',
    category: 'admin',
    tier: 'All Plans',
    status: 'Live',
    version: 'v2.2',
    lastUpdated: 'September 2026',
    summary:
      'Admins can update Privacy Policy, Terms, Refund Policy, About Us, Contact info, and Blog articles with instant database persistence.',
    howToUse: [
      'Go to Admin > Pages & Legal CMS.',
      'Select any page tab to edit sections, summaries, or articles.',
      'Click "Save Changes" to publish immediately without redeployment.',
    ],
    iconName: 'FileText',
    tags: ['CMS', 'Legal', 'Pages', 'Blog', 'Admin'],
  },
  {
    id: 'pdf-profile-generator',
    title: '1-Click Printable PDF Profile Kit',
    category: 'anchor',
    tier: 'Starter',
    status: 'Live',
    version: 'v2.0',
    lastUpdated: 'August 2026',
    summary:
      'Generate a sleek, print-ready PDF profile kit with your bio, photo, past clients, and contact details to email agencies.',
    howToUse: [
      'Visit your public profile.',
      'Click "Download PDF Profile" or "Share Kit".',
      'Print-ready PDF generates instantly formatted for corporate agencies.',
    ],
    iconName: 'FileDown',
    tags: ['PDF', 'Profile Kit', 'Pitching', 'Print'],
  },
];

/**
 * Register a new platform feature into the documentation registry.
 * Call this function whenever a new capability or module is introduced.
 */
export function registerPlatformFeature(feature: PlatformFeature) {
  const existingIdx = PLATFORM_FEATURES_REGISTRY.findIndex((f) => f.id === feature.id);
  if (existingIdx >= 0) {
    PLATFORM_FEATURES_REGISTRY[existingIdx] = feature;
  } else {
    PLATFORM_FEATURES_REGISTRY.unshift(feature);
  }
}

/**
 * Get all platform features combining the built-in registry
 * and any dynamic features stored in platform_settings.
 */
export function getAllPlatformFeatures(customFeatures: PlatformFeature[] = []): PlatformFeature[] {
  const combined = [...customFeatures, ...PLATFORM_FEATURES_REGISTRY];
  const uniqueMap = new Map<string, PlatformFeature>();
  combined.forEach((item) => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });
  return Array.from(uniqueMap.values());
}

// ---- Future Scope & Upcoming Roadmap Registry ----
export interface FutureRoadmapItem {
  id: string;
  title: string;
  quarter: string;
  category: 'AI & Automation' | 'Commercial & Finance' | 'Team & Backstage' | 'Global & Scale';
  status: 'In Design' | 'Planned' | 'Under Research';
  summary: string;
  keyCapabilities: string[];
  impactForArtists: string;
}

export const FUTURE_ROADMAP_ITEMS: FutureRoadmapItem[] = [
  {
    id: 'universal-multi-artist-expansion',
    title: 'Universal Multi-Artist Platform & Audio Embeds (DJs, Singers, Comedians)',
    quarter: 'Sprint 1 · Ready / Active',
    category: 'Team & Backstage',
    status: 'In Design',
    summary:
      'Expands StageHost from emcees to all 11 performing artist categories (DJs, Live Singers, Bands, Standup Comedians, Dancers, Magicians, Photographers) with SoundCloud / Spotify audio players and gig setlists.',
    keyCapabilities: [
      'SoundCloud, Spotify, Apple Music, and Mixcloud audio player embeds on public stage portfolios',
      'Gig Repertoire & Setlist Builder (Bollywood, Sufi, Retro 90s, EDM, Commercial playlists)',
      'Multi-Artist Bundled Inquiries: Planners can hire an Anchor + DJ + Photographer in a single checkout',
    ],
    impactForArtists: 'Expands platform addressable market 10x from 50k emcees to 500k+ performing artists across India.',
  },
  {
    id: 'custom-domains-white-label',
    title: 'Custom Domains Multi-Tenant White-Labeling (anchorname.com)',
    quarter: 'Sprint 1 · High ROI',
    category: 'Commercial & Finance',
    status: 'In Design',
    summary:
      'Allows premium artists to brand their own domain (e.g. priyapatel.live, rahulsharma.com) with automated Cloudflare/Vercel wildcard SSL certificates and hidden StageHost branding.',
    keyCapabilities: [
      'DNS CNAME / A-Record verification with automatic 60-second Let\'s Encrypt SSL provisioning',
      'Next.js dynamic middleware hostname rewriting directly to the artist\'s internal slug route',
      'Admin approval workflow inside Admin > Platform Settings with 1-click domain activation',
    ],
    impactForArtists: 'Major booking prestige for ₹1L+ celebrity artists and primary upsell driver for the Premium Plan.',
  },
  {
    id: 'pdf-quotation-rate-card',
    title: 'Automated PDF Quotation & Rate Card Proposal Generator',
    quarter: 'Sprint 2 · CRM Power',
    category: 'Commercial & Finance',
    status: 'Planned',
    summary:
      'Generate pixel-perfect, branded PDF proposals and rate cards with letterhead, scope of work, technical riders, and commercial terms in 5 seconds directly from leads.',
    keyCapabilities: [
      'Itemized Scope of Work: briefing calls, rehearsals, stage hosting, sound checks, and crowd games',
      'Commercial Quotation Breakdown: Base fee + Outstation travel/accommodation note + 50/50 payment milestones',
      '1-click "Download PDF Proposal" and "Send PDF via WhatsApp" to corporate agencies and event planners',
    ],
    impactForArtists: 'Replaces messy Canva/Word proposals and closes corporate corporate agency deals 3x faster.',
  },
  {
    id: 'client-side-webp-compression',
    title: 'Client-Side Media Compression Pipeline (WebP Engine)',
    quarter: 'Sprint 3 · Infrastructure',
    category: 'Global & Scale',
    status: 'Planned',
    summary:
      'Browser-based image optimization pipeline that resizes raw 15MB–25MB DSLR photographer photos to ~250KB WebP in-browser before uploading to Supabase.',
    keyCapabilities: [
      'HTML5 Canvas & Web Worker compression to max 1920px width at 0.82 WebP quality factor',
      'Automatic 400x400 thumbnail generation for high-speed directory cards and mobile previews',
      'Zero storage bloat and instantaneous portfolio loading over Indian mobile 4G/5G networks',
    ],
    impactForArtists: 'Lightning-fast mobile portfolio speed and zero Supabase storage quota exhaustion.',
  },
  {
    id: 'one-click-social-auth',
    title: 'One-Click Social Authentication (Google & Apple OAuth)',
    quarter: 'Sprint 4 · Growth',
    category: 'Global & Scale',
    status: 'Planned',
    summary:
      'Frictionless 1-click registration and login for artists and planners using Google Cloud and Apple Developer Services IDs.',
    keyCapabilities: [
      'Single-tap "Continue with Google" and "Continue with Apple" on login and registration pages',
      'Auto-extracts user full name and Google avatar to pre-populate the artist\'s stage profile and vanity slug',
      'Eliminates password reset friction and dropped signups during mobile onboarding',
    ],
    impactForArtists: 'Zero signup drop-offs; instant onboarding in under 30 seconds.',
  },
  {
    id: 'meta-whatsapp-cloud-api',
    title: 'Meta WhatsApp Cloud API (Automated Instant Ping)',
    quarter: 'Sprint 5 · Automation',
    category: 'AI & Automation',
    status: 'Planned',
    summary:
      'Direct official Meta WhatsApp Cloud API integration that instantly sends a structured booking notification to the artist\'s personal phone the moment a lead submits an inquiry.',
    keyCapabilities: [
      'Pre-approved inquiry_alert_v1 template with client name, phone, event genre, city, and budget',
      'Quick action buttons inside WhatsApp chat: "Chat with Client" and "View in Dashboard"',
      'Automated fallback webhook listener at /api/whatsapp/webhook with delivery status tracking',
    ],
    impactForArtists: 'Enables instant response within 5 minutes, boosting booking conversion rates by 80%.',
  },
  {
    id: 'two-way-google-calendar-sync',
    title: 'Two-Way Google Calendar Real-Time Sync',
    quarter: 'Sprint 6 · Automation',
    category: 'AI & Automation',
    status: 'Planned',
    summary:
      'Bi-directional synchronization: Personal events added in Google Calendar automatically block availability on StageHost, eliminating double-booking risks.',
    keyCapabilities: [
      'Google Calendar Webhook Watch API (calendar.events.watch) for real-time busy slot syncing',
      'Privacy protection: personal event titles are masked as "Engaged / Private Booking" to protect host privacy',
      'Automatic two-way reconciliation between StageHost schedule slots and Google Calendar events',
    ],
    impactForArtists: 'Guarantees 100% schedule accuracy without manual calendar maintenance.',
  },
  {
    id: 'gst-tax-invoicing-suite',
    title: 'Automated GST Tax Invoicing for Subscriptions & Gigs',
    quarter: 'Sprint 7 · Compliance',
    category: 'Commercial & Finance',
    status: 'Planned',
    summary:
      'Generates official GST-compliant tax invoice PDFs with sequential numbering, SAC codes 9996/9983, and Input Tax Credit (ITC) data for LLPs and Sole Proprietorships.',
    keyCapabilities: [
      'Captures Registered Business Name, GSTIN, and Billing Address in settings',
      'Auto-generates sequential invoices (e.g. INV-2026-0042) with CGST/SGST/IGST breakdown upon payment capture',
      'Downloadable tax invoice PDF history available in the artist\'s billing dashboard tab',
    ],
    impactForArtists: 'Hassle-free tax compliance and effortless input credit claiming for professional artists.',
  },
  {
    id: 'mobile-pwa-push-notifications',
    title: 'Mobile Progressive Web App (PWA) & Web Push Notifications',
    quarter: 'Sprint 8 · Retention',
    category: 'Team & Backstage',
    status: 'Planned',
    summary:
      'Full Progressive Web App with standalone home-screen launch, background sync, and native device push notifications for new inquiries and show briefings.',
    keyCapabilities: [
      'Web App Manifest (standalone display, theme #0a0a14) and Service Worker offline caching',
      'Native Web Push Notifications when a new client inquiry arrives or a hold is about to expire',
      'Instant backstage launch without opening Safari/Chrome or typing URLs',
    ],
    impactForArtists: 'Native app feel on iPhone and Android with zero App Store / Play Store friction.',
  },
];
