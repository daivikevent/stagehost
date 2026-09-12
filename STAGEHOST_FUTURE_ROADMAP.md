# 🚀 StageHost — Future Implementation Roadmap & Technical Specification

> **Purpose:** This document details the strategic, architectural, and future feature roadmap for StageHost. Any software engineer, product manager, or technical lead can reference this document to understand what is completed, what is pending (including Razorpay live setup), why it matters, and how to implement each feature.

---

## 📊 Development Status Overview (Live Tracker)

| Status | Feature / Milestone | Technology / Architecture |
| :--- | :--- | :--- |
| ✅ **Shipped** | **Google 1-Click Social Authentication** | Supabase OAuth + StageHost Branding |
| ✅ **Shipped** | **Mobile PWA & Background WebPush Notifications** | VAPID, Service Worker, PushManager, Lockscreen Alerts |
| ✅ **Shipped** | **Client-Side Image Compression** | HTML5 Canvas WebP conversion (15MB ➔ ~250KB) |
| ✅ **Shipped** | **Live Resend Email Infrastructure** | Transactional & booking alert emails |
| ✅ **Shipped** | **Admin & User Plan Dynamic Synchronization** | Supabase `platform_settings` + Pricing matrix |
| ✅ **Shipped** | **Universal Multi-Artist Architecture (Foundation)** | 11 categories (DJ, Singer, Band, Emcee, etc.) |
| 🔴 **Immediate** | **Razorpay Live Merchant Integration & Webhook** | Live API keys, UPI AutoPay, Webhook verification |
| 🟡 **Phase 1** | **Meta WhatsApp Cloud API (Automated Alert)** | Meta Graph API, Pre-approved template, Direct ping |
| 🟡 **Phase 1** | **PDF Quotation & Rate Card Generator** | Serverless / `@react-pdf` branded client proposals |
| 🟡 **Phase 2** | **Custom Domains White-Labeling (`anchorname.com`)** | CNAME routing, Next.js proxy rewrite, SSL automation |
| 🟡 **Phase 2** | **Two-Way Google Calendar Real-Time Sync** | Google Calendar API, webhook watch, automatic date block |
| 🟡 **Phase 3** | **GST Tax Invoice Generator for Subscriptions** | 18% GST calculation, sequential numbering, PDF download |
| 🟡 **Phase 3** | **Audio & Stream Embeds (Spotify, SoundCloud)** | Embedded audio players for DJs, Singers, Voiceovers |
| 🟡 **Phase 4** | **Gig Repertoire & Setlist Builder** | Genre curation, signature tracks, performance riders |
| 🟡 **Phase 4** | **AI Portfolio Bio & Repertoire Assistant** | Gemini API prompt engine for anchor bios & pitch decks |

---

## 💳 Priority 0 (Immediate): Razorpay Live Merchant Integration & Automated Subscriptions

### Current State:
- Razorpay SDK, order creation endpoint (`/api/payment/create-order`), advance payment receipt flow (`/api/receipt/create-advance-order`), and webhook handler (`/api/payment/webhook`) are fully coded and tested with test fixtures.
- Environment variables currently hold placeholder credentials (`rzp_test_placeholder`, `placeholder_razorpay_secret`).

### Activation Steps (Pending Merchant Onboarding):
1. **Obtain Live Merchant Keys:**
   - Complete KYC and business verification on [Razorpay Dashboard](https://dashboard.razorpay.com).
   - Generate Live Key ID (`rzp_live_...`) and Live Key Secret.
2. **Configure Production Environment:**
   - Update `.env.local` and deployment hosting environment variables:
     ```env
     NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
     RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
     RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
     ```
3. **Configure Webhook in Razorpay Dashboard:**
   - URL: `https://stagehost.in/api/payment/webhook`
   - Active Events:
     - `payment.captured`
     - `order.paid`
     - `subscription.charged` / `subscription.cancelled`
4. **Subscription Automation:**
   - When payment succeeds, webhook handler automatically activates Pro (₹599) or Premium (₹1,299) subscription in Supabase `subscriptions` table and updates `profile.plan_tier`.
   - Handles auto-renewal and failure notifications.

---

## 🤖 Feature 1: Meta WhatsApp Cloud API (Automated Instant Ping)

### Problem Statement:
Inquiries arrive via email and native device push notifications, but Indian anchors and event planners run their entire business on WhatsApp. An event inquiry answered within 10–15 minutes has an 80% higher closure rate.

### Value Proposition:
Instant automated delivery directly into the anchor's personal WhatsApp chat the second a client hits "Submit Inquiry" on their portfolio.

### Technical Implementation:
1. **Meta WhatsApp Business Platform Integration:**
   - Create Meta Developer App with WhatsApp Cloud API enabled.
   - Obtain Phone Number ID, WhatsApp Business Account ID (WABA ID), and Permanent System User Access Token.
2. **Pre-approved WhatsApp Message Template (`inquiry_alert_v1`):**
   ```text
   🔔 *NEW STAGEHOST BOOKING LEAD* 🔔
   
   Hi {{1}}, you have received a new event booking inquiry!
   
   👤 *Client:* {{2}}
   📞 *Phone:* {{3}}
   🎉 *Event:* {{4}}
   📅 *Date:* {{5}}
   📍 *City:* {{6}}
   💰 *Budget:* {{7}}
   
   [ Button: Chat with Client on WhatsApp ]
   [ Button: View in Dashboard ]
   ```
3. **Trigger Workflow (`src/lib/actions/inquiries.ts`):**
   - After saving inquiry in database, call Meta Graph API:
     `POST https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages`
   - Send template payload with dynamic parameters.

---

## 📄 Feature 2: Automated PDF Quotation & Rate Card Generator

### Problem Statement:
Corporate event planners (Google, Amazon, TCS, Reliance) and luxury wedding organizers require formal **PDF Proposals & Commercial Rate Cards** with professional letterheads and payment terms before booking an anchor. Anchors currently waste hours manually creating Canva or Word templates.

### Value Proposition:
Anchor can click **"Generate Quotation"** on any inquiry card in `/inquiries`, review the client details, adjust commercial pricing, and generate a pixel-perfect, branded PDF proposal in 5 seconds.

### Technical Implementation:
1. **Architecture:**
   - Client or serverless PDF rendering using `@react-pdf/renderer` or Puppeteer/Chromium.
2. **Quotation Components:**
   - **Header:** Anchor name, profile photo, contact details, social handles, and verified badge.
   - **Event Scope:** Client name, event date, venue, city, and stage responsibilities (e.g. Host briefings, guest interaction, rehearsals).
   - **Commercial Breakdown:**
     - Performance hosting fee.
     - Outstation travel, logistics, and accommodation terms.
     - Advance payment terms (e.g. 50% advance on confirmation, 50% before stage entry).
   - **Terms & Cancellation Policy:** Explicit guidelines on date rescheduling and cancellation forfeits.
3. **Export & Sharing Options:**
   - Download PDF button.
   - "Send PDF via WhatsApp" button using generated public link or WhatsApp Web API.

---

## 🌐 Feature 3: Custom Domains Multi-Tenant White-Labeling (`anchorname.com`)

### Problem Statement:
Celebrity anchors and top-tier emcees charge ₹50,000 to ₹2,00,000+ per event. They want to brand their own domain (e.g., `priyapatel.live` or `rahulsharma.com`) rather than sharing `stagehost.in/rahulsharma`.

### Value Proposition:
- The #1 conversion trigger for upgrading to the **Premium Plan (₹1,299/mo)**.
- Provides a 100% white-labeled experience while StageHost powers the backend CRM, scheduling, and forms behind the scenes.

### Technical Implementation:
1. **DNS Architecture:**
   - Anchor creates a `CNAME` record in GoDaddy / Cloudflare / Hostinger pointing to `cname.stagehost.in`.
2. **Next.js Proxy Routing (`proxy.ts` / `middleware.ts`):**
   - Check incoming `Host` header.
   - If `host` is not `stagehost.in` or `localhost`:
     - Query database or edge cache for custom domain mapping to anchor slug.
     - Rewrite request to `/[slug]` without changing browser address bar.
3. **Automated SSL:**
   - Cloudflare for SaaS (Custom Hostnames) or Vercel Domains API (`POST /v1/domains`) to auto-provision SSL certificates within 60 seconds of DNS propagation.

---

## 🔄 Feature 4: Two-Way Google Calendar Real-Time Sync

### Problem Statement:
StageHost currently supports 1-way iCal subscription (`/api/calendar/[slug]`). While events from StageHost appear in Apple/Google Calendar, personal appointments or family trips added in Google Calendar do not automatically block dates in StageHost.

### Value Proposition:
Eliminates double-booking risk completely. When an anchor marks a personal appointment in Google Calendar, StageHost's public portfolio calendar automatically marks the date as **"Booked"**.

### Technical Implementation:
1. **Google OAuth 2.0 Scope:**
   - Request `https://www.googleapis.com/auth/calendar.events.readonly` scope.
   - Securely encrypt and store OAuth `refresh_token` in Supabase.
2. **Webhook Watch Channel:**
   - Call Google Calendar API `events.watch` to receive push notifications on calendar changes.
   - When Google fires a change notification, query busy slots and synchronize with `schedule_slots` table.
3. **Privacy Masking:**
   - Private event titles (e.g., "Doctor Appointment") are strictly masked as "Engaged / Private Booking" on public calendars to protect privacy.

---

## 🧾 Feature 5: Automated GST Tax Invoice Generation for Subscriptions

### Problem Statement:
Indian artists and anchors registered as Sole Proprietorships, Partnerships, or Private Limited companies have GST numbers. When they subscribe to Pro (₹599) or Premium (₹1,299), they require a valid GST tax invoice with StageHost's GSTIN to claim Input Tax Credit (ITC).

### Technical Implementation:
1. **Tax Information Collection (`/settings` ➔ Billing Tab):**
   - Anchor enters Registered Business Name, GSTIN, and Billing State.
2. **Invoice Calculation Engine:**
   - If billing state matches StageHost's state: CGST 9% + SGST 9%.
   - If interstate: IGST 18%.
3. **Automated Generation upon Razorpay Webhook:**
   - Generate sequential invoice number (e.g. `SH-2026-00142`).
   - Render PDF invoice and upload to Supabase Storage `invoices/` bucket.
   - Display a "Download Tax Invoice" button in the anchor's billing history table.

---

## 🎧 Feature 6: Audio & Stream Embeds for Multi-Artist Expansion

### Problem Statement:
With StageHost expanding beyond Anchors to DJs, Singers, Bands, and Voiceover Artists, video embeds alone are not enough. Musicians and DJs need to showcase their mixtapes, original compositions, and audio reels directly on their portfolios.

### Technical Implementation:
1. **Supported Providers:**
   - **SoundCloud:** Track and playlist widget embeds (`w.soundcloud.com/player/`).
   - **Spotify:** Artist, album, or track embeds (`open.spotify.com/embed/`).
   - **Apple Music & Mixcloud:** Audio widgets.
2. **Portfolio Audio Section (`/[slug]`):**
   - Dedicated "Audio Showcase & Mixtapes" player section on portfolios for DJs, Singers, and Musicians.
   - Lightweight preview player that streams tracks without page reloading.

---

## 📋 Feature 7: Gig Repertoire & Setlist Builder

### Problem Statement:
Singers, Live Bands, and DJs need a structured way to present their song repertoire, genres (Bollywood, Sufi, Punjabi, Retro 90s, EDM, Commercial), and technical stage riders to event organizers.

### Technical Implementation:
1. **Repertoire Manager in Dashboard (`/portfolio` ➔ Repertoire Tab):**
   - Categorized song list builder (Title, Original Artist, Language/Genre).
   - "Download Tech Rider / Sound Checklist" for sound engineers (Microphone types, DJ console model, in-ear monitors).
2. **Public Presentation:**
   - Searchable song list on the artist's portfolio allowing wedding planners to browse the artist's repertoire.

---

## 🤝 Feature 8: Multi-Artist Booking Bundles (Agency / Crew Mode)

### Problem Statement:
Event planners and wedding couples rarely hire an Anchor in isolation; they book an entire entertainment package (e.g. Emcee + DJ + Live Band + Sound Setup).

### Value Proposition:
Allows anchors and artists to cross-promote each other and accept bundled inquiries.

### Technical Implementation:
1. **Artist Crews / Collectives:**
   - Allow anchors to link partner DJs or photographers to their profile as "Recommended Crew".
2. **Bundled Inquiries:**
   - Inquiry form includes checkboxes: *"Do you also need a DJ or Live Band for this event?"*
   - Automatically duplicates the lead and alerts the partner artists on StageHost.

---

## 🧠 Feature 9: AI Portfolio Bio & Repertoire Assistant

### Problem Statement:
Many talented anchors and performers struggle to write compelling, high-converting bios and stage introductions for their portfolios.

### Value Proposition:
1-click AI bio writer that creates punchy, professional elevator pitches tailored for weddings, corporate summits, and concerts.

### Technical Implementation:
1. **Integration:**
   - Lightweight integration with Google Gemini API via Supabase Edge Function or Next.js server action.
2. **User Input:**
   - Anchor inputs 3 bullet points: Years of experience, notable brands/events hosted, signature style (Energetic, Humorous, Sophisticated).
3. **Output:**
   - Generates 3 polished bio variations (Short elevator pitch, Detailed corporate profile, Luxury wedding bio).

---

## 🏁 Summary: Execution Priority Matrix

| Feature | Target Audience | Effort | Business Impact | Status / Target Sprint |
| :--- | :--- | :--- | :--- | :--- |
| **Razorpay Live Merchant Integration** | All Users | Low | 🔴 Critical (Revenue & Monetization) | **Immediate / Live KYC** |
| **Meta WhatsApp Cloud API** | All Artists | High | 🟢 Massive (Fastest lead response) | **Sprint 1** |
| **PDF Quotation / Rate Card Generator** | Corporate & Wedding Hosts | Medium | 🟢 High (Daily commercial utility) | **Sprint 2** |
| **Custom Domains (`anchorname.com`)** | Premium Anchors | Medium | 🟢 High (Drives ₹1,299/mo plan) | **Sprint 3** |
| **2-Way Google Calendar Sync** | Active Hosts | High | 🟡 Medium (Calendar power users) | **Sprint 4** |
| **GST Tax Invoices for Subscriptions** | Registered Businesses | Medium | 🟡 Medium (B2B Compliance) | **Sprint 5** |
| **Audio & Mixtape Embeds (Spotify/SoundCloud)** | DJs, Singers, Musicians | Low | 🟢 High (Deepens multi-artist adoption) | **Sprint 6** |
| **Gig Repertoire & Tech Rider Builder** | Musicians & DJs | Medium | 🟡 Medium (Professionalism boost) | **Sprint 7** |
| **Multi-Artist Booking Bundles** | Event Planners & Crews | High | 🟢 High (Increases booking volume) | **Sprint 8** |
| **AI Bio & Repertoire Assistant** | All Artists | Low | 🟡 Medium (Onboarding conversion) | **Sprint 9** |

---

*Last Updated: September 2026 — Verified against live codebase, Supabase database, and production build.*
