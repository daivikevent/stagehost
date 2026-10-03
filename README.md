# BookMyArtist — Enterprise Platform for Stage Anchors, Emcees & Live Artists

> **Your Talent. Your Brand. Your Bookings.**
> The all-in-one digital operating system and portfolio engine built specifically for event hosts, wedding emcees, corporate presenters, DJs, live musicians, and performing artists of all kinds.

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

## 🔮 Future Scope & Development Roadmap (From BOOKMYARTIST_FUTURE_ROADMAP.md)

| Feature | Category | Status | Summary |
|---|---|---|---|
| **🎭 Universal Multi-Artist Architecture** | Categories & Media | ✅ **Shipped** | Expansion to 11 performing artist categories (DJs, Singers, Bands, Emcees, Comedians, Dancers, Magicians) with custom specialties & tags. |
| **🌐 Custom Domains White-Labeling (`artistname.com`)** | Commercial & Branding | ✅ **Shipped** | CNAME routing & Next.js transparent rewrite with automated SSL for Premium artists. |
| **🔄 Two-Way Google Calendar Real-Time Sync** | Automation & Schedule | ✅ **Shipped** | Bi-directional synchronization: personal Google/Apple calendar events automatically block dates on BookMyArtist. |
| **🔑 One-Click Social Auth (Google OAuth)** | Growth & Onboarding | ✅ **Shipped** | 1-tap Google login & onboarding with automatic avatar and profile provisioning. |
| **🖼️ Client-Side Media Compression (WebP)** | Infrastructure | ✅ **Shipped** | HTML5 Canvas WebP compression (15MB ➔ ~250KB) before upload to Supabase Storage. |
| **📱 Mobile PWA & Background Web Push Notifications** | Mobile & Notifications | ✅ **Shipped** | Standalone PWA installable on iOS/Android with lockscreen inquiry notifications. |
| **📄 Automated PDF Quotation & Rate Card Generator** | Commercial & Proposals | 🟡 Planned | 1-click corporate quotation generator with itemized scope of work and payment terms. |
| **🤖 Meta WhatsApp Cloud API (Automated Ping)** | AI & Automation | 🟡 Planned | Official WhatsApp Cloud API integration delivering lead notifications directly to artist chats. |
| **📑 Automated GST Tax Invoicing for Subscriptions** | Compliance & Finance | 🟡 Planned | GST-compliant tax invoicing with B2B GSTIN collection and downloadable PDF invoices. |

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
