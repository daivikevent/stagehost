export interface PolicySection {
  title: string;
  content: string;
}

export interface PrivacyContent {
  title: string;
  lastUpdated: string;
  summary: string;
  sections: PolicySection[];
}

export interface TermsContent {
  title: string;
  lastUpdated: string;
  summary: string;
  sections: PolicySection[];
}

export interface RefundContent {
  title: string;
  lastUpdated: string;
  summary: string;
  sections: PolicySection[];
}

export interface AboutContent {
  headline: string;
  subtitle: string;
  story: string;
  stats: { label: string; value: string }[];
  values: { title: string; desc: string }[];
}

export interface ContactContent {
  title: string;
  subtitle: string;
  email: string;
  whatsapp: string;
  phone: string;
  address: string;
  hours: string;
  responseCommitment: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  readTime: string;
  publishedAt: string;
  excerpt: string;
  content: string;
  author: string;
}

export interface BlogContent {
  title: string;
  subtitle: string;
  articles: BlogArticle[];
}

export const DEFAULT_PAGE_CONTENTS: {
  privacy: PrivacyContent;
  terms: TermsContent;
  refund: RefundContent;
  about: AboutContent;
  contact: ContactContent;
  blog: BlogContent;
  how_it_works?: any;
} = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'September 2026',
    summary:
      'At StageHost, we take your privacy and data security with utmost seriousness. This policy details how we collect, store, and process your information across our website and individual anchor portfolios.',
    sections: [
      {
        title: '1. Information We Collect',
        content:
          'We collect information that you directly provide when registering as an anchor (name, phone number, email address, bio, social media profiles, performance media, event pricing) and when submitting event inquiries or client reviews (name, phone number, event dates, event city, and review comments).',
      },
      {
        title: '2. How We Use Your Data',
        content:
          'Your information is used to power your public anchor portfolio, facilitate direct client bookings via WhatsApp and email, prevent spam and fraud, generate verified trust badges, and deliver platform notifications and analytics.',
      },
      {
        title: '3. Data Sharing & Third Parties',
        content:
          'StageHost does NOT sell, rent, or monetize your personal data. When a client submits an inquiry through an anchor portfolio, their contact details are shared directly and exclusively with that anchor. We use trusted infrastructure providers (Supabase, Razorpay, Resend) strictly for authentication, payments, and transactional communication.',
      },
      {
        title: '4. Cookie Policy & Analytics',
        content:
          'We use privacy-friendly local storage and session cookies solely to maintain your authentication state and record anonymous page views on anchor portfolios to provide accurate traffic analytics.',
      },
      {
        title: '5. Security & Data Retention',
        content:
          'All communications are encrypted using TLS 1.3. Databases are secured with Row Level Security (RLS). You can request complete deletion of your account and all associated media at any time by contacting our support team.',
      },
      {
        title: '6. Grievance Officer & Contact',
        content:
          'For any questions or privacy grievances under the Information Technology Act (India), you may reach our designated Data Protection Officer at privacy@stagehost.in.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'September 2026',
    summary:
      'Please review these Terms of Service carefully before utilizing the StageHost platform or creating your digital anchor portfolio.',
    sections: [
      {
        title: '1. Acceptance of Terms',
        content:
          'By accessing or using StageHost, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, you must not use our service.',
      },
      {
        title: '2. User Accounts & Anchor Verification',
        content:
          'Anchors must provide accurate, current, and genuine information regarding their identity, experience, and media. StageHost reserves the right to suspend or remove profiles that use deceptive media, impersonate other artists, or violate intellectual property rights.',
      },
      {
        title: '3. Booking Inquiries, Direct Dealings & Intermediary Safe Harbor',
        content:
          'StageHost operates strictly as an intermediary technology platform and portfolio hosting service under Section 79 of the Information Technology Act, 2000 (India). StageHost does NOT charge commissions on event bookings, does NOT act as an employer, agent, or event organizer, and is NOT a party to contracts or financial arrangements between clients and independent anchors. All bookings, negotiations, advance deposits, and cancellations are executed directly between the client and the artist.',
      },
      {
        title: '4. Subscription Fees & Renewals',
        content:
          'Paid subscriptions (Starter, Pro, and Premium tiers) grant access to premium features including custom domains, priority directory ranking, and advanced analytics. Subscriptions are billed on a recurring monthly or annual basis unless cancelled prior to renewal.',
      },
      {
        title: '5. Prohibited Conduct',
        content:
          'Users agree not to upload defamatory, obscene, or infringing content, abuse the inquiry messaging system for spam or harassment, or attempt to reverse-engineer or scrape the StageHost platform.',
      },
      {
        title: '6. Limitation of Liability & Artist Absence / No-Show Disclaimers',
        content:
          'StageHost shall not be held liable for any direct, indirect, incidental, punitive, or consequential damages arising from artist delays, unexcused absences, no-shows, failure to perform, event disruption, or advance payment disputes. Clients and organizers expressly acknowledge that their sole legal recourse in the event of an artist cancellation or breach of contract is directly against the individual artist or anchor.',
      },
      {
        title: '7. Verified Artist Badge Policy (Paid Subscription & KYC Records)',
        content:
          'The Verified Artist badge is awarded exclusively to artists holding an active paid subscription (Starter, Pro, Premium) or verified through administrative review. Verification confirms that the artist has completed identity and contact authentication via active electronic payment gateway records. A Verified Badge does NOT constitute a performance warranty, fidelity bond, or personal guarantee of service by StageHost.',
      },
      {
        title: '8. Artist Code of Conduct & Fraud Blacklisting',
        content:
          'StageHost maintains zero tolerance for fraudulent artist behavior, booking misrepresentation, or unexcused no-shows. Upon receipt of a verified complaint from a client or event organizer, StageHost reserves the unconditional right to immediately suspend or permanently terminate the artist’s profile, revoke verified badges, delete the artist’s directory listing and custom URL slug, and cooperate fully with law enforcement or legal authorities.',
      },
      {
        title: '9. Governing Law & Dispute Resolution',
        content:
          'These terms and any disputes arising from or in connection with the StageHost platform shall be governed by and construed in accordance with the laws of India, subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra.',
      },
    ],
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    lastUpdated: 'September 2026',
    summary:
      'We believe in complete transparency and customer satisfaction for all StageHost subscription tiers and platform services.',
    sections: [
      {
        title: '1. StageHost Pro & Elite Subscription Refunds',
        content:
          'We offer a 7-day no-questions-asked refund guarantee on all new annual Pro and Elite subscriptions. If you feel StageHost is not the right fit for your anchor career within 7 days of initial purchase, contact support@stagehost.in for a full refund.',
      },
      {
        title: '2. Monthly Subscription Cancellations',
        content:
          'Monthly subscriptions can be cancelled at any time from your Account Settings. Upon cancellation, you will retain Pro/Elite access until the end of the current billing cycle, with no subsequent charges.',
      },
      {
        title: '3. Event Booking Advance & Fee Disputes',
        content:
          'StageHost does not handle or hold advance deposits for event performances. All performance fee negotiations, deposits, and cancellation terms are directly agreed upon between the anchor and the event client. StageHost is not responsible for issuing refunds for artist cancellations.',
      },
      {
        title: '4. Refund Processing Time',
        content:
          'Approved subscription refunds are processed via our payment gateway (Razorpay) to the original payment method within 5 to 7 business days.',
      },
    ],
  },
  about: {
    headline: 'Empowering India’s Emcees & Event Anchors',
    subtitle:
      'StageHost is India’s dedicated digital portfolio and booking management platform built specifically for stage artists, corporate emcees, and wedding anchors.',
    story:
      'Before StageHost, live event hosts had to rely on scattered social media links, heavy PDF presentations, and unreliable WhatsApp forwards. We recognized that India’s live event industry is booming, yet anchors lacked a professional, high-performance home for their craft.\n\nStageHost was built to give every anchor a lightning-fast, mobile-optimized digital stage—complete with verified client reviews, video showreels, calendar availability, and direct WhatsApp inquiries with zero commissions.',
    stats: [
      { label: 'Active Anchors', value: '7500+' },
      { label: 'Cities Represented', value: '50+' },
      { label: 'Inquiries Generated', value: '10,000+' },
      { label: 'Commission Kept by Anchors', value: '100%' },
    ],
    values: [
      {
        title: 'Artist-First Economics',
        desc: 'We charge zero commissions on your gig bookings. You keep 100% of what event clients pay you.',
      },
      {
        title: 'Blazing Fast Speed',
        desc: 'Every anchor portfolio loads in under 400ms on mobile networks, ensuring zero lost client impressions.',
      },
      {
        title: 'Verified Trust Badges',
        desc: 'Authentic client testimonials verified with phone and event details build unmatched confidence for corporate planners.',
      },
      {
        title: 'Direct Client Relationships',
        desc: 'No middleman delays. Inquiries land directly on your WhatsApp with complete event specs and budget.',
      },
    ],
  },
  contact: {
    title: 'Contact Support & Inquiries',
    subtitle:
      'Have a question about StageHost or need support setting up your anchor portfolio? Our team is here to assist you.',
    email: 'support@stagehost.in',
    whatsapp: '+91 98765 43210',
    phone: '+91 98765 43210',
    address: 'StageHost Digital Media, Bandra West, Mumbai, Maharashtra 400050',
    hours: 'Monday to Saturday, 10:00 AM – 7:00 PM IST',
    responseCommitment:
      'We typically respond to all emails and WhatsApp messages within 2 hours during active business hours.',
  },
  blog: {
    title: 'StageHost Blog & Host Guides',
    subtitle:
      'Insider advice, industry playbooks, and stagecraft tips for professional anchors and event organizers.',
    articles: [
      {
        id: '1',
        title: '10 Proven Ways to Charge Higher Rates as a Wedding Anchor',
        slug: 'charge-higher-rates-wedding-anchor',
        category: 'Career Growth',
        readTime: '5 min read',
        publishedAt: 'September 2026',
        author: 'StageHost Editorial Team',
        excerpt:
          'Learn the positioning techniques, video showreel secrets, and client inquiry scripts top emcees use to command ₹50,000+ per night.',
        content: `### Why Most Anchors Undercharge\n\nMany talented emcees struggle to command premium pricing simply because their online presence does not reflect their on-stage brilliance. Sending a low-resolution PDF or asking clients to scroll through months of personal Instagram posts creates friction.\n\n### 1. Build a Dedicated Portfolio URL\nHaving a branded website like **stagehost.in/your-name** immediately positions you in the top 5% of professional hosts.\n\n### 2. Showcase Categorized Video Showreels\nOrganizers want to see you in action at their specific event type—whether that is a high-energy Sangeet, a formal corporate summit, or an intimate cocktail evening.\n\n### 3. Display Verified Client Testimonials\nTrust is the number one driver of wedding booking decisions. Collect reviews directly from couples and event planners with photo verification.`,
      },
      {
        id: '2',
        title: 'How to Handle Unexpected Audio Glitches Live on Stage',
        slug: 'handling-stage-audio-glitches',
        category: 'Stagecraft',
        readTime: '4 min read',
        publishedAt: 'August 2026',
        author: 'Pooja Hegde (Senior Corporate Emcee)',
        excerpt:
          'A masterclass in stage presence, crowd management, and humor when the microphone dies or feedback screams.',
        content: `### The Golden Rule: Don’t Freeze\n\nEvery anchor dreads the sudden squeal of microphone feedback or a completely dead handheld mid-sentence. What separates amateurs from seasoned pros is how smoothly you navigate the silence.\n\n1. **Acknowledge it with light humor**: A quick witty remark dispels awkward tension.\n2. **Project your acoustic voice**: Step closer to the front row and engage without yelling.\n3. **Coordinate discreetly with sound technicians**: Have a subtle hand signal established during soundcheck.`,
      },
      {
        id: '3',
        title: 'The Ultimate Corporate Event Checklist for Emcees',
        slug: 'ultimate-corporate-event-checklist',
        category: 'Checklists',
        readTime: '6 min read',
        publishedAt: 'August 2026',
        author: 'Rohan Deshmukh',
        excerpt:
          'From dignitary pronunciation checks to backup cue cards: everything you need before taking the corporate stage.',
        content: `### 24 Hours Before the Summit\n\n- Confirm correct pronunciation and designations of all C-suite speakers and dignitaries.\n- Request the finalized run-of-show (ROS) document and print hard copies as backup.\n- Verify dress code (Business Formal vs Smart Casual).\n\n### 90 Minutes Before Showtime\n\n- Soundcheck on stage with the exact cordless mic and lavalier you will use.\n- Check teleprompter or slide clicker sync if conducting panel discussions.\n- Identify the stage manager and floor manager for real-time timing cues.`,
      },
    ],
  },
  how_it_works: {
    title: 'How StageHost Works',
    subtitle: 'Everything you need to master your digital anchor stage and book top event talent',
    badge: 'Complete User Guide',
    customNotes: 'All new platform features are registered automatically in the live feature directory.',
  },
};

export type PageKey = keyof typeof DEFAULT_PAGE_CONTENTS;
