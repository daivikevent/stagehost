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
      'At BookMyArtist, we take your privacy and data security with utmost seriousness. This policy details how we collect, store, and process your information across our website and individual artist portfolios.',
    sections: [
      {
        title: '1. Information We Collect',
        content:
          'We collect information that you directly provide when registering as an artist (name, phone number, email address, bio, social media profiles, performance media, event pricing) and when submitting event inquiries or client reviews (name, phone number, event dates, event city, and review comments).',
      },
      {
        title: '2. How We Use Your Data',
        content:
          'Your information is used to power your public artist portfolio, facilitate direct client bookings via WhatsApp and email, prevent spam and fraud, generate verified trust badges, and deliver platform notifications and analytics.',
      },
      {
        title: '3. Data Sharing & Third Parties',
        content:
          'BookMyArtist does NOT sell, rent, or monetize your personal data. When a client submits an inquiry through an artist portfolio, their contact details are shared directly and exclusively with that artist. We use trusted infrastructure providers (Supabase, Razorpay, Resend) strictly for authentication, payments, and transactional communication.',
      },
      {
        title: '4. Cookie Policy & Analytics',
        content:
          'We use privacy-friendly local storage and session cookies solely to maintain your authentication state and record anonymous page views on artist portfolios to provide accurate traffic analytics.',
      },
      {
        title: '5. Security & Data Retention',
        content:
          'All communications are encrypted using TLS 1.3. Databases are secured with Row Level Security (RLS). You can request complete deletion of your account and all associated media at any time by contacting our support team.',
      },
      {
        title: '6. Grievance Officer & Contact',
        content:
          'For any questions or privacy grievances under the Information Technology Act (India), you may reach our designated Data Protection Officer at privacy@bookmyartist.in.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'September 2026',
    summary:
      'Please review these Terms of Service carefully before utilizing the BookMyArtist platform or creating your digital artist portfolio.',
    sections: [
      {
        title: '1. Acceptance of Terms',
        content:
          'By accessing or using BookMyArtist, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, you must not use our service.',
      },
      {
        title: '2. User Accounts & Artist Verification',
        content:
          'Artists must provide accurate, current, and genuine information regarding their identity, experience, and media. BookMyArtist reserves the right to suspend or remove profiles that use deceptive media, impersonate other artists, or violate intellectual property rights.',
      },
      {
        title: '3. Booking Inquiries, Direct Dealings & Intermediary Safe Harbor',
        content:
          'BookMyArtist operates strictly as an intermediary technology platform and portfolio hosting service under Section 79 of the Information Technology Act, 2000 (India). BookMyArtist does NOT charge commissions on event bookings, does NOT act as an employer, agent, or event organizer, and is NOT a party to contracts or financial arrangements between clients and independent artists. All bookings, negotiations, advance deposits, and cancellations are executed directly between the client and the artist.',
      },
      {
        title: '4. Subscription Fees & Renewals',
        content:
          'Paid subscriptions (Starter, Pro, and Premium tiers) grant access to premium features including custom domains, priority directory ranking, and advanced analytics. Subscriptions are billed on a recurring monthly or annual basis unless cancelled prior to renewal.',
      },
      {
        title: '5. Prohibited Conduct',
        content:
          'Users agree not to upload defamatory, obscene, or infringing content, abuse the inquiry messaging system for spam or harassment, or attempt to reverse-engineer or scrape the BookMyArtist platform.',
      },
      {
        title: '6. Limitation of Liability & Artist Absence / No-Show Disclaimers',
        content:
          'BookMyArtist shall not be held liable for any direct, indirect, incidental, punitive, or consequential damages arising from artist delays, unexcused absences, no-shows, failure to perform, event disruption, or advance payment disputes. Clients and organizers expressly acknowledge that their sole legal recourse in the event of an artist cancellation or breach of contract is directly against the individual artist or performer.',
      },
      {
        title: '7. Verified Artist Badge Policy (Paid Subscription & KYC Records)',
        content:
          'The Verified Artist badge is awarded exclusively to artists holding an active paid subscription (Starter, Pro, Premium) or verified through administrative review. Verification confirms that the artist has completed identity and contact authentication via active electronic payment gateway records. A Verified Badge does NOT constitute a performance warranty, fidelity bond, or personal guarantee of service by BookMyArtist.',
      },
      {
        title: '8. Artist Code of Conduct & Fraud Blacklisting',
        content:
          'BookMyArtist maintains zero tolerance for fraudulent artist behavior, booking misrepresentation, or unexcused no-shows. Upon receipt of a verified complaint from a client or event organizer, BookMyArtist reserves the unconditional right to immediately suspend or permanently terminate the artist’s profile, revoke verified badges, delete the artist’s directory listing and custom URL slug, and cooperate fully with law enforcement or legal authorities.',
      },
      {
        title: '9. Governing Law & Dispute Resolution',
        content:
          'These terms and any disputes arising from or in connection with the BookMyArtist platform shall be governed by and construed in accordance with the laws of India, subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra.',
      },
    ],
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    lastUpdated: 'September 2026',
    summary:
      'We believe in complete transparency and customer satisfaction for all BookMyArtist subscription tiers and platform services.',
    sections: [
      {
        title: '1. BookMyArtist Pro & Elite Subscription Refunds',
        content:
          'We offer a 7-day no-questions-asked refund guarantee on all new annual Pro and Elite subscriptions. If you feel BookMyArtist is not the right fit for your artist career within 7 days of initial purchase, contact support@bookmyartist.in for a full refund.',
      },
      {
        title: '2. Monthly Subscription Cancellations',
        content:
          'Monthly subscriptions can be cancelled at any time from your Account Settings. Upon cancellation, you will retain Pro/Elite access until the end of the current billing cycle, with no subsequent charges.',
      },
      {
        title: '3. Event Booking Advance & Fee Disputes',
        content:
          'BookMyArtist does not handle or hold advance deposits for event performances. All performance fee negotiations, deposits, and cancellation terms are directly agreed upon between the artist and the event client. BookMyArtist is not responsible for issuing refunds for artist cancellations.',
      },
      {
        title: '4. Refund Processing Time',
        content:
          'Approved subscription refunds are processed via our payment gateway (Razorpay) to the original payment method within 5 to 7 business days.',
      },
    ],
  },
  about: {
    headline: 'Empowering India’s Performing Artists & Entertainers',
    subtitle:
      'BookMyArtist is India’s dedicated digital portfolio and booking management platform built specifically for stage artists, corporate emcees, live singers, DJs, musicians, and performers.',
    story:
      'Before BookMyArtist, live event performers had to rely on scattered social media links, heavy PDF presentations, and unreliable WhatsApp forwards. We recognized that India’s live event industry is booming, yet artists lacked a professional, high-performance home for their craft.\n\nBookMyArtist was built to give every performer a lightning-fast, mobile-optimized digital stage—complete with verified client reviews, video showreels, calendar availability, and direct WhatsApp inquiries with zero commissions.',
    stats: [
      { label: 'Active Artists', value: '7500+' },
      { label: 'Cities Represented', value: '50+' },
      { label: 'Inquiries Generated', value: '10,000+' },
      { label: 'Commission Kept by Artists', value: '100%' },
    ],
    values: [
      {
        title: 'Artist-First Economics',
        desc: 'We charge zero commissions on your gig bookings. You keep 100% of what event clients pay you.',
      },
      {
        title: 'Blazing Fast Speed',
        desc: 'Every artist portfolio loads in under 400ms on mobile networks, ensuring zero lost client impressions.',
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
      'Have a question about BookMyArtist or need support setting up your artist portfolio? Our team is here to assist you.',
    email: 'support@bookmyartist.in',
    whatsapp: '+91 98765 43210',
    phone: '+91 98765 43210',
    address: 'BookMyArtist Digital Media, Bandra West, Mumbai, Maharashtra 400050',
    hours: 'Monday to Saturday, 10:00 AM – 7:00 PM IST',
    responseCommitment:
      'We typically respond to all emails and WhatsApp messages within 2 hours during active business hours.',
  },
  blog: {
    title: 'BookMyArtist Blog & Artist Guides',
    subtitle:
      'Insider advice, industry playbooks, and stagecraft tips for professional artists, performers, and event organizers.',
    articles: [
      {
        id: '1',
        title: '10 Proven Ways to Charge Higher Rates as a Live Performer',
        slug: 'charge-higher-rates-live-performer',
        category: 'Career Growth',
        readTime: '5 min read',
        publishedAt: 'September 2026',
        author: 'BookMyArtist Editorial Team',
        excerpt:
          'Learn the positioning techniques, video showreel secrets, and client inquiry scripts top artists use to command ₹50,000+ per night.',
        content: `### Why Most Artists Undercharge\n\nMany talented performers struggle to command premium pricing simply because their online presence does not reflect their on-stage brilliance. Sending a low-resolution PDF or asking clients to scroll through months of personal Instagram posts creates friction.\n\n### 1. Build a Dedicated Portfolio URL\nHaving a branded website like **bookmyartist.in/your-name** immediately positions you in the top 5% of professional performers.\n\n### 2. Showcase Categorized Video Showreels\nOrganizers want to see you in action at their specific event type—whether that is a high-energy Sangeet, a formal corporate summit, or an intimate cocktail evening.\n\n### 3. Display Verified Client Testimonials\nTrust is the number one driver of event booking decisions. Collect reviews directly from couples and event planners with photo verification.`,
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
    title: 'How BookMyArtist Works',
    subtitle: 'Everything you need to master your digital artist stage and book top event talent',
    badge: 'Complete User Guide',
    customNotes: 'All new platform features are registered automatically in the live feature directory.',
  },
};

export type PageKey = keyof typeof DEFAULT_PAGE_CONTENTS;
