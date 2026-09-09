# StageHost — Enterprise Platform for Stage Anchors, Emcees & Live Artists

> **Your Stage. Your Brand. Your Bookings.**
> The all-in-one digital operating system and portfolio engine built specifically for event hosts, wedding emcees, corporate presenters, DJs, live musicians, and stage anchors.

---

## 🌟 What's New in Version 2.8 (September 2026 Release)

### 1. ⏳ Pencil Hold Expiry Timer & Smart WhatsApp Nudge
- **Dual Mode Flexibility**: Holds default to **None (Manual Hold)** without forced countdowns. Users can optionally activate `24h`, `48h`, `72h`, `7d`, or **Custom** deadlines (with quick `+12 Hours` and `+5 Days` offset buttons).
- **Executive Amber Pipeline Banner**: Displays expiring holds at a glance with countdown badges (`⏳ 32h left` / `⚠️ Expired`).
- **1-Click WhatsApp Nudge**: Sends pre-formatted, polite reminder messages asking clients to confirm or release their held date.
- **Direct Edit Access**: Dedicated **Edit** button inside the Active Holds modal to update hold details instantly without multiple clicks.

### 2. ⚔️ Date Clash & Dual-Inquiry Detection Engine
- **Live Collision Badges**: `/inquiries` automatically cross-references inbound inquiry event dates against confirmed and tentative bookings:
  - `⚔️ Booked Clash` (Show already locked in)
  - `⚡ Hold Clash (Nudge Opportunity)` (Tentative pencil hold on that date)
- **Negotiation Leverage Tool**: Detail panel includes 1-click action buttons to WhatsApp the hold client (*"Sir, a second client is inquiring for your date"*) or reply to the new client proposing alternative open dates.

### 3. 💳 Razorpay Advance Token Payment on Public Receipts
- **Online Checkout on Public Receipts**: `/receipt/[id]` includes online payment support for credit/debit cards, netbanking, and UPI QR codes.
- **Token Presets**: Clients can pay preset tokens (₹10,000, ₹15,000, ₹25,000, or a custom amount).
- **Auto-Conversion to Confirmed Show**: Successful Razorpay payment automatically strips `[PENCIL_HOLD]`, marks the calendar slot as `booked`, updates the receipt, and notifies the artist.

### 4. 📅 1-Click Direct Google Calendar Sync & WebCal Feeds
- **Per-Event Direct Link**: Every confirmed and held show card has a direct `📅 Cal` button generating a pre-filled Google Calendar event URL with venue, client contact, and show cue notes.
- **Enhanced WebCal Modal**: 1-click "Subscribe in Google Calendar" and "Subscribe in Apple Calendar" links using dynamic `/api/calendar/[slug]` iCal feeds.

### 5. 📄 Offline Backstage PWA & Legal Performance Contract
- **Service Worker Offline Caching**: `sw.js` and `manifest.json` cache schedules, receipts, and cue sheets so artists can access their show details in zero-network ballroom basements.
- **Formal Legal Contract View**: Receipt pages include a toggleable **Artist Performance Engagement Agreement** complete with technical riders, financial milestones, cancellation terms, and digital E-Signature seals ready for print or PDF.

### 6. 🎛️ 1-Screen Fit Switcher & Executive Header Action Bar
- **Primary View Switcher**:
  - `[ 📅 Calendar View ]`: Focused month grid and day detail panel.
  - `[ 📋 Shows Pipeline ]`: Displays all shows at the top of the viewport with sticky headers and compact rows without scrolling past the calendar.
  - `[ 🔲 All-in-One ]`: Classic unified vertical layout.
- **Executive Header Bar**: Single-line clean toolbar featuring Primary `+ Add Booking` alongside unified `Import/Export`, `Sync Cal`, and `Portfolio ↗` tools without awkward wrapping.

---

## 🚀 How to Use Core Workflows

### A. Managing Holds & Sending WhatsApp Nudges
1. Go to **Dashboard > Schedule** and click **+ Add Booking**.
2. Toggle status to **🟡 Pencil Hold (Tentative)**.
3. Select desired hold duration or keep **🚫 None (Manual Hold)**.
4. If a client delays, click **View Holds** on the top amber banner and press **⚡ WhatsApp Nudge**.
5. To update hold info directly, click **✏️ Edit** right from the modal.

### B. Handling Inbound Inquiries & Date Clashes
1. Go to **Dashboard > Inquiries**.
2. Check for `⚔️ Booked Clash` or `⚡ Hold Clash` badges next to inquiries.
3. Click on the inquiry to review client budget, event genre, and contact details.
4. Use the **Clash Management** box to either leverage the hold client into paying an advance token or suggest alternative dates to the new prospect.

### C. Collecting Advance Tokens via Public Receipts
1. Open the booking in **Schedule** and click the **Receipt** icon.
2. Enter the advance amount or set a token deposit.
3. Click **Share Receipt** and send the public `/receipt/[id]` URL to your client.
4. Client clicks **Pay Token Online** and pays via UPI/Card. The hold instantly switches to Confirmed.

### D. Syncing with Google & Apple Calendar
1. Click **Sync Cal** in the top action bar of the Schedule page.
2. Click **Subscribe in Google Calendar** or **Subscribe in Apple Calendar**.
3. All new bookings, travel blocks, and held dates sync automatically to your phone.

---

## 🔮 Future Scope & Development Roadmap (From STAGEHOST_FUTURE_ROADMAP.md)

| Feature | Sprint / Target | Category | Status | Summary |
|---|---|---|---|---|
| **🎭 Universal Multi-Artist Architecture & Audio Embeds** | Sprint 1 | Team & Backstage | Active / In Design | Expansion to all 11 performing artist categories (DJs, Live Singers, Bands, Standup Comedians, Dancers, Magicians, Photographers) with SoundCloud / Spotify players, repertoire setlists, and bundled event packages. |
| **🌐 Custom Domains Multi-Tenant White-Labeling** | Sprint 1 | Commercial & Finance | In Design | Allows ₹1L+ celebrity emcees to point their personal domain (`anchorname.com`) with automated Cloudflare/Vercel Let's Encrypt SSL and zero StageHost branding. |
| **📄 Automated PDF Quotation & Rate Card Proposal Generator** | Sprint 2 | Commercial & Finance | Planned | 1-click corporate quotation generator with itemized scope of work (briefing, rehearsals, event hosting), 50/50 payment milestones, and WhatsApp proposal delivery. |
| **🖼️ Client-Side Media Compression Pipeline (WebP)** | Sprint 3 | Infrastructure | Planned | Browser-based HTML5 canvas engine that resizes raw 15MB–25MB DSLR photographer photos to ~250KB WebP before upload, ensuring lightning-fast mobile loading. |
| **🔑 One-Click Social Authentication (Google & Apple OAuth)** | Sprint 4 | Growth & Onboarding | Planned | Instant 1-tap artist registration and login with Google Cloud and Apple Services IDs, automatically provisioning profile avatars and stage vanity slugs. |
| **🤖 Meta WhatsApp Cloud API (Automated Instant Ping)** | Sprint 5 | AI & Automation | Planned | Official WhatsApp Cloud API integration delivering structured lead notification templates to the artist's personal WhatsApp within seconds of form submission. |
| **🔄 Two-Way Google Calendar Real-Time Sync** | Sprint 6 | Automation | Planned | Bi-directional synchronization: personal events added in Google Calendar automatically block availability on StageHost with privacy-masked labels. |
| **📑 Automated GST Tax Invoicing for Subscriptions & Gigs** | Sprint 7 | Compliance & Finance | Planned | Official GST-compliant tax invoicing engine with sequential numbers (INV-2026-XXXX), SAC 9996/9983, and Input Tax Credit (ITC) data for LLPs. |
| **📱 Mobile Progressive Web App (PWA) & Web Push Notifications** | Sprint 8 | Retention & Mobile | Planned | Standalone mobile home-screen app with background sync and native Web Push Notifications for new inquiries and hold expiry alerts. |

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
git clone https://github.com/stagehost/stagehost.git
cd stagehost

# Install dependencies
npm install

# Run TypeScript type check
npx tsc --noEmit

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
