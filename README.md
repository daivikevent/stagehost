# BookMyArtist — Enterprise Platform for Stage Anchors, Emcees & Live Artists

> **Your Talent. Your Brand. Your Bookings.**
> The all-in-one digital operating system and portfolio engine built specifically for event hosts, wedding emcees, corporate presenters, DJs, live musicians, and performing artists of all kinds.

---

## 🌟 What's New in Version 3.0 (October 2026 Release)

### 1. ✍️ Digital Performance Agreement & Mobile E-Sign (`/agreement/[id]`)
- **Interactive Mobile Finger Signature Pad**: Clients can draw and execute their digital signature directly on their smartphone touchscreen using HTML5 Canvas.
- **7-Clause Standard Entertainment Contract**: Protects artists with call time protocols, performance milestones, overtime hourly rates, non-refundable advance terms, and force majeure.
- **Zero-Escrow Platform Disclaimer**: Explicit legal clause confirming BookMyArtist is strictly a digital software enablement tool with zero booking liability and zero advance escrow holding; contracts and payments remain 100% direct between artist and organizer.
- **Immutable Cryptographic Hash**: Every executed agreement generates a verifiable timestamped signature seal with 1-click WhatsApp and PDF export.

### 2. 📍 City + Category Dynamic SEO Landing Pages (`/artists/[city]` & `/artists/[city]/[category]`)
- **High-Ranking Organic Discovery**: Next.js SSR landing pages for local queries (e.g. `Best DJs in Mumbai`, `Wedding Singer Delhi`, `Anchor in Jaipur`) without paid ad spend.
- **Rich Snippets & Schemas**: Auto-generates JSON-LD `ItemList` and `FAQPage` structured schemas indexed via dynamic `sitemap.xml`.
- **Instant Availability & Live Date Filter**: Event planners can filter performers by specific event date and city directly in `/directory`.

### 3. ⭐ Post-Event Direct Review Collector (`/review/[slug]`)
- **Direct 5-Star Feedback Loop**: Artists can copy their personalized review link (`/review/[slug]`) from `/portfolio` and send it via WhatsApp the morning after a performance.
- **Verified Testimonials Feed**: Client ratings, designations, and reviews instantly publish to the artist's live stage portfolio.

### 4. 🎛️ Stage Soundcheck & Tech Rider Studio (`/schedule`)
- **Eliminates Venue Sound Chaos**: Customizable technical rider generator to specify vocal microphones (Shure Beta 58A / Sennheiser), in-ear monitors, stage wedges, DJ consoles (CDJ-3000), and stage power.
- **1-Tap WhatsApp Sound Engineer Dispatch**: Generates a clean visual checklist shared directly with event production managers and venue audio engineers.

### 5. ⚙️ Dynamic Profile Dropdowns & Taxonomy Manager (`/admin/settings`)
- **Real-Time Database Sync**: Super admins can add, rename, or remove artist categories, event genres, languages, and cities in real-time, synchronized with Supabase `platform_settings`.

### 6. 📶 Enhanced Service Worker v2 Offline Portfolio Caching
- **Banquet Hall Offline Mode**: Caches artist portfolios, cue sheets, and schedules so they open instantly in zero-cellular hotel basements and heritage forts.

---

## 🔮 Future Scope & Development Roadmap (From BOOKMYARTIST_FUTURE_ROADMAP.md)

| Feature | Category | Status | Summary |
|---|---|---|---|
| **🎭 Universal Multi-Artist Architecture** | Categories & Media | ✅ **Shipped** | Expansion to 11 performing artist categories (DJs, Singers, Bands, Emcees, Comedians, Dancers, Magicians) with custom specialties & tags. |
| **🌐 Custom Domains White-Labeling (`artistname.com`)** | Commercial & Branding | ✅ **Shipped** | CNAME routing & Next.js transparent rewrite with automated SSL for Premium artists. |
| **🔄 Two-Way Google Calendar Real-Time Sync** | Automation & Schedule | ✅ **Shipped** | Bi-directional synchronization: personal Google/Apple calendar events automatically block dates on BookMyArtist. |
| **🔑 One-Click Social Auth (Google OAuth)** | Growth & Onboarding | ✅ **Shipped** | 1-tap Google login & onboarding with automatic avatar and profile provisioning. |
| **🖼️ Client-Side Media Compression (WebP)** | Infrastructure | ✅ **Shipped** | HTML5 Canvas WebP compression (15MB ➔ ~250KB) before upload to Supabase Storage. |
| **📄 Automated PDF Quotation & Rate Card Generator** | Commercial & Proposals | ✅ **Shipped** | 1-click corporate quotation generator with itemized scope of work, A4 PDF print/download, and WhatsApp sharing. |
| **🤖 Meta WhatsApp Cloud API (Automated Ping)** | AI & Automation | ✅ **Shipped** | Official WhatsApp Cloud API integration delivering lead notifications directly to artist chats with sandbox test fallback. |
| **📑 Automated GST Tax Invoicing for Subscriptions** | Compliance & Finance | ✅ **Shipped** | GST-compliant tax invoicing (Rule 46) with B2B GSTIN collection, sequential numbering, and downloadable PDF invoices. |
| **🎁 Artist Referral & Rewards Engine** | Growth & Community | ✅ **Shipped** | 1-click WhatsApp invite links, live referral tracking, community leaderboard, and admin reward policies. |
| **✍️ Digital Performance Agreement (E-Sign)** | Legal & Contracts | ✅ **Shipped** | Mobile finger signature canvas, 7-clause legal protection, and zero escrow disclaimer. |
| **📍 City + Category SEO Landing Pages** | SEO & Discovery | ✅ **Shipped** | Dynamic SSR pages with JSON-LD schemas for organic client leads. |
| **⭐ Post-Event Direct Review Collector** | Social Proof & CRM | ✅ **Shipped** | WhatsApp review loop (`/review/[slug]`) saving to verified testimonials. |
| **🎛️ Stage Soundcheck & Tech Rider Studio** | Audio Production | ✅ **Shipped** | Audio checklist generator for sound engineers with 1-tap WhatsApp sharing. |
| **⚙️ Dynamic Profile Taxonomy Manager** | Super Admin Control | ✅ **Shipped** | Real-time database sync for artist categories, event genres, languages, and cities. |
| **📱 1-Click Verified WhatsApp Inquiries** | Security & Leads | ✅ **Shipped** | Anti-spam 4-digit PIN verification + 1-click WhatsApp routing with verified client badges. |

---

## 🛠️ Technology Stack
- **Framework**: Next.js 15 (App Router, Server Components & Server Actions)
- **Language**: TypeScript 5 (Strict Type Safety)
- **Database & Auth**: Supabase (PostgreSQL, Row-Level Security, Realtime Subscriptions)
- **Styling**: Modern CSS Modules with CSS Variables & Glassmorphism Design System
- **Payments**: Razorpay Gateway (UPI, Cards, Netbanking) with local simulation engine
- **PWA**: Service Worker caching, offline manifest, responsive mobile-first architecture
- **Calendar**: RFC 5545 iCalendar WebCal generator (`/api/calendar/[slug]`)
- **PDF Generation**: Native browser print stylesheets & HTML5 canvas rendering

---

## 💻 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/bookmyartist/bookmyartist.git
cd bookmyartist

# Install dependencies
npm install

# Run TypeScript type check
npx tsc --noEmit

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
