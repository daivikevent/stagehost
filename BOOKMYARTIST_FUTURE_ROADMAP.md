# 🚀 BookMyArtist — Future Implementation Roadmap & Technical Specification

> **Purpose:** This document details the strategic, architectural, and future feature roadmap for BookMyArtist. Any software engineer, product manager, or technical lead can reference this document to understand what is completed, what is pending (including Razorpay live setup), why it matters, and how to implement each feature.

---

## 📊 Development Status Overview (Live Tracker)

| Status | Feature / Milestone | Technology / Architecture |
| :--- | :--- | :--- |
| ✅ **Shipped** | **Google 1-Click Social Authentication** | Supabase OAuth + BookMyArtist Branding |
| ✅ **Shipped** | **Mobile PWA & Background WebPush Notifications** | VAPID, Service Worker, PushManager, Lockscreen Alerts |
| ✅ **Shipped** | **Client-Side Image Compression** | HTML5 Canvas WebP conversion (15MB ➔ ~250KB) |
| ✅ **Shipped** | **Live Resend Email Infrastructure** | Transactional & booking alert emails |
| ✅ **Shipped** | **Admin & User Plan Dynamic Synchronization** | Supabase `platform_settings` + Pricing matrix |
| ✅ **Shipped** | **Universal Multi-Artist Architecture (Foundation)** | 11 categories (DJ, Singer, Band, Emcee, etc.) |
| ✅ **Shipped** | **Custom Domains White-Labeling (`artistname.com`)** | CNAME routing, Next.js proxy rewrite, SSL automation |
| ✅ **Shipped** | **Two-Way Google Calendar Real-Time Sync** | iCal parser, auto date-blocking, double-booking prevention |
| ✅ **Shipped** | **Razorpay Merchant Integration & Auto-Activation** | Sandbox simulation mode, signature verification, live-key support |
| ✅ **Shipped** | **Meta WhatsApp Cloud API (Automated Alert)** | Meta Graph API, instant lead alerts, webhook listener, admin test ping |
| ✅ **Shipped** | **PDF Quotation & Rate Card Generator** | Branded executive client proposals, A4 PDF print/download, WhatsApp sharing |
| ✅ **Shipped** | **Brand Logo & Multi-Placement Sizing Studio** | Admin logo upload, 7-location height sliders, live multi-screen preview |
| ✅ **Shipped** | **GST Tax Invoice Generator for Subscriptions** | Indian GST Act Rule 46, 18% GST breakdown, B2B ITC claim, sequential PDF |
| ✅ **Shipped** | **Artist Referral & Rewards Core System** | 1-Click WhatsApp invite, live tracking, admin policy studio (validity, cash, leaderboard) |
| 🔵 **Phase 1 (Upcoming)** | **City + Category SEO Landing Pages** | Dynamic SSR pages (`/djs-in-mumbai`, etc.) for zero-ad Google organic discovery |
| 🔵 **Phase 1 (Upcoming)** | **Directory Date & City Availability Filter** | Real-time date availability checker for event planners |
| 🔵 **Phase 1 (Upcoming)** | **1-Click Verified WhatsApp Inquiries** | Phone-verified, high-intent lead routing to block spam |
| 🔵 **Phase 1 (Upcoming)** | **Digital Performance Agreement (E-Sign)** | Mobile finger e-signature agreement to protect artist dates & terms |
| 🔵 **Phase 1 (Upcoming)** | **Post-Event Automated Review Collector** | Day-after WhatsApp review link & verified portfolio badge |
| 🔵 **Phase 1 (Upcoming)** | **Stage Soundcheck & Tech Rider Checklist** | Technical rider generator (mics, monitors, mixer) for sound engineers |
| 🔵 **Phase 1 (Upcoming)** | **Featured Artist Directory Boost** | Monetized top-of-directory spotlight for premium artists |
| 🔵 **Phase 1 (Upcoming)** | **Offline Portfolio PWA Caching** | Service worker asset caching for banquet halls with weak internet |
| 🔵 **Phase 1 (Upcoming)** | **Artist Smart Analytics & Lead Intelligence** | City-level visitor breakdown and conversion tracking |
| 🟡 **Phase 2 (Pending)** | **Audio & Stream Embeds (Spotify, SoundCloud)** | Embedded audio players for DJs, Singers, Voiceovers (Future Scope) |
| 🟡 **Phase 2 (Pending)** | **Gig Repertoire & Setlist Builder** | Genre curation, signature tracks, performance riders (Future Scope) |
| 🟡 **Phase 2 (Pending)** | **Multi-Artist Booking Bundles (Agency Mode)** | Bundled package inquiries for Event Planners & Crews (Future Scope) |
| 🟡 **Phase 2 (Pending)** | **AI Portfolio Bio & Repertoire Assistant** | Gemini API prompt engine for artist bios & pitch decks (Future Scope) |
| 🟡 **Phase 2 (Pending)** | **🦁 Brand Mascot — "BMA Lion"** | Lion mascot for branding, onboarding, error pages, social media (Future Scope) |
| 🟣 **Phase 3 (Future Scope)** | **Two-Sided "Give & Get" Referral Incentives** | 15-day free trial gift for new artist + 30 days for referrer |
| 🟣 **Phase 3 (Future Scope)** | **Instant Referral WhatsApp & Email Notifications** | Automated real-time alerts when peer joins via invite |
| 🟣 **Phase 3 (Future Scope)** | **Ambassador Milestone Tiers & Prestige Badges** | Bronze, Silver, Gold creator ranks with homepage spotlight |
| 🟣 **Phase 3 (Future Scope)** | **1-Click Instagram & WhatsApp Story Card Generator** | 1080x1920 viral poster generator with artist photo & QR |
| 🟣 **Phase 3 (Future Scope)** | **Automated Validity Credit Engine** | Real-time subscription validity extension without manual admin actions |
| 🟣 **Phase 3 (Future Scope)** | **Artist UPI Wallet & Cash Withdrawal System** | UPI ID payout requests with 1-click Razorpay Payouts |
| 🟣 **Phase 3 (Future Scope)** | **Client & Event Planner Referral Engine** | Organizer-to-organizer referral loops with booking credits |

---

> 🚫 **Platform Scope Boundary (Explicit Non-Goal & Core Architecture Rule):**
> **No Advance Escrow or Booking Liability:** BookMyArtist is strictly a **SaaS software enablement, digital portfolio, and CRM platform** for artists — NOT an event management agency, broker, or booking intermediary. BookMyArtist does **NEVER** hold client advance funds in escrow, does **NOT** intermediate client-artist payments, and does **NOT** assume liability for show execution, artist performance, or client cancellations. Contracts, advance payments, and fee settlements remain 100% direct between the artist and their client.

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
   - URL: `https://bookmyartist.in/api/payment/webhook`
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
Inquiries arrive via email and native device push notifications, but Indian artists and event planners run their entire business on WhatsApp. An event inquiry answered within 10–15 minutes has an 80% higher closure rate.

### Value Proposition:
Instant automated delivery directly into the artist's personal WhatsApp chat the second a client hits "Submit Inquiry" on their portfolio.

### Technical Implementation:
1. **Meta WhatsApp Business Platform Integration:**
   - Create Meta Developer App with WhatsApp Cloud API enabled.
   - Obtain Phone Number ID, WhatsApp Business Account ID (WABA ID), and Permanent System User Access Token.
2. **Pre-approved WhatsApp Message Template (`inquiry_alert_v1`):**
   ```text
   🔔 *NEW BOOKMYARTIST BOOKING LEAD* 🔔
   
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
Corporate event planners (Google, Amazon, TCS, Reliance) and luxury wedding organizers require formal **PDF Proposals & Commercial Rate Cards** with professional letterheads and payment terms before booking an artist. Artists currently waste hours manually creating Canva or Word templates.

### Value Proposition:
Artist can click **"Generate Quotation"** on any inquiry card in `/inquiries`, review the client details, adjust commercial pricing, and generate a pixel-perfect, branded PDF proposal in 5 seconds.

### Technical Implementation:
1. **Architecture:**
   - Client or serverless PDF rendering using `@react-pdf/renderer` or Puppeteer/Chromium.
2. **Quotation Components:**
   - **Header:** Artist name, profile photo, contact details, social handles, and verified badge.
   - **Event Scope:** Client name, event date, venue, city, and performance responsibilities (e.g. Briefings, rehearsals, sound checks).
   - **Commercial Breakdown:**
     - Performance fee.
     - Outstation travel, logistics, and accommodation terms.
     - Advance payment terms (e.g. 50% advance on confirmation, 50% before stage entry).
   - **Terms & Cancellation Policy:** Explicit guidelines on date rescheduling and cancellation forfeits.
3. **Export & Sharing Options:**
   - Download PDF button.
   - "Send PDF via WhatsApp" button using generated public link or WhatsApp Web API.

---

## 🌐 Feature 3: Custom Domains Multi-Tenant White-Labeling (`artistname.com`)

### Problem Statement:
Celebrity artists and top-tier performers charge ₹50,000 to ₹5,00,000+ per event. They want to brand their own domain (e.g., `priyapatel.live` or `rahulsharma.com`) rather than sharing `bookmyartist.in/rahulsharma`.

### Value Proposition:
- The #1 conversion trigger for upgrading to the **Premium Plan (₹1,299/mo)**.
- Provides a 100% white-labeled experience while BookMyArtist powers the backend CRM, scheduling, and forms behind the scenes.

### Technical Implementation:
1. **DNS Architecture:**
   - Artist creates a `CNAME` record in GoDaddy / Cloudflare / Hostinger pointing to `cname.bookmyartist.in`.
2. **Next.js Proxy Routing (`proxy.ts` / `middleware.ts`):**
   - Check incoming `Host` header.
   - If `host` is not `bookmyartist.in` or `localhost`:
     - Query database or edge cache for custom domain mapping to artist slug.
     - Rewrite request to `/[slug]` without changing browser address bar.
3. **Automated SSL:**
   - Cloudflare for SaaS (Custom Hostnames) or Vercel Domains API (`POST /v1/domains`) to auto-provision SSL certificates within 60 seconds of DNS propagation.

---

## 🔄 Feature 4: Two-Way Google Calendar Real-Time Sync

### Problem Statement:
BookMyArtist currently supports 1-way iCal subscription (`/api/calendar/[slug]`). While events from BookMyArtist appear in Apple/Google Calendar, personal appointments or family trips added in Google Calendar do not automatically block dates in BookMyArtist.

### Value Proposition:
Eliminates double-booking risk completely. When an artist marks a personal appointment in Google Calendar, BookMyArtist's public portfolio calendar automatically marks the date as **"Booked"**.

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
Indian artists registered as Sole Proprietorships, Partnerships, or Private Limited companies have GST numbers. When they subscribe to Pro (₹599) or Premium (₹1,299), they require a valid GST tax invoice with BookMyArtist's GSTIN to claim Input Tax Credit (ITC).

### Technical Implementation:
1. **Tax Information Collection (`/settings` ➔ Billing Tab):**
   - Artist enters Registered Business Name, GSTIN, and Billing State.
2. **Invoice Calculation Engine:**
   - If billing state matches BookMyArtist's state: CGST 9% + SGST 9%.
   - If interstate: IGST 18%.
3. **Automated Generation upon Razorpay Webhook:**
   - Generate sequential invoice number (e.g. `BMA-2026-00142`).
   - Render PDF invoice and upload to Supabase Storage `invoices/` bucket.
   - Display a "Download Tax Invoice" button in the artist's billing history table.

---

## 🔵 Phase 1: Core Platform Superchargers (High-Priority Upgrades)

> **Context:** High-leverage features to drive organic client discovery, maximize lead conversions, protect artist performance contracts, and elevate BookMyArtist into an essential daily OS for Indian artists.

---

### 📍 Feature 1.1: City + Category Dynamic SEO Landing Pages (`/[category]-in-[city]`)
* **Problem Statement:** Event planners and wedding clients search Google for local talent: *"Best wedding DJ in Mumbai"*, *"Female Anchor in Delhi"*, *"Live Band in Jaipur"*. Currently, all search traffic must land on generic pages.
* **Value Proposition:** Generates dozens of targeted, high-ranking landing pages without any paid ad spend, bringing a constant stream of organic client leads directly to listed artists.
* **Technical Implementation:**
  1. Next.js dynamic routing: `/app/[category]-in-[city]/page.tsx` (e.g. `/djs-in-mumbai`, `/singers-in-delhi`).
  2. SSR rendering with dynamic metadata, OpenGraph tags, and JSON-LD structured data (`itemListElement` with `MusicGroup`, `PerformingGroup`, `LocalBusiness`).
  3. Displays curated grid of verified artists based in or traveling to that city, with direct "View Stage Portfolio" and "Inquire Date" buttons.
  4. Dynamic XML sitemap generator (`sitemap.ts`) automatically indexes every active city-category combination.

---

### 📅 Feature 1.2: Directory Instant Date & City Availability Filter
* **Problem Statement:** Event planners organizing an event on November 25th currently have to open 10 artist profiles one-by-one to see who is available.
* **Value Proposition:** Event planners can enter their exact event date and city right in `/directory`. BookMyArtist instantly filters and shows only performers who are 100% available on that date.
* **Technical Implementation:**
  1. Add date-picker and city selector filter bar in `/directory`.
  2. Query `schedule_slots` and Google Calendar synced events to cross-check busy dates in real-time.
  3. Artists with conflicts on that date are dimmed or filtered out, while free artists show a bright green *"Available on Nov 25"* badge with 1-click inquiry.

---

### 📱 Feature 1.3: 1-Click Phone-Verified WhatsApp Inquiries (Spam Blocker)
* **Problem Statement:** High-profile artists dislike spam or casual test inquiries flooding their phones.
* **Value Proposition:** Ensures artists only receive serious, high-budget, phone-verified inquiries from legitimate event planners.
* **Technical Implementation:**
  1. Inquiry form validates Indian mobile numbers using regex format (`+91` 10 digits).
  2. Fast 4-digit SMS OTP or 1-tap WhatsApp verification ping before the lead is dispatched to the artist's CRM and WhatsApp.
  3. Verified leads receive a blue *"Verified Planner / Client"* badge in the artist's `/inquiries` dashboard.

---

### ✍️ Feature 1.4: Digital Performance Agreement / Contract (E-Sign on Mobile)
* **Problem Statement:** Artists frequently face sudden gig cancellations without advance compensation, or clients demanding extra hours on stage without agreed overtime pay.
* **Value Proposition:** Artist can click *"Create Performance Agreement"* on any inquiry in `/inquiries`, customize the terms, and generate a legally structured digital contract. The client signs with their finger on their smartphone screen.
* **Important Architecture & Legal Note:** BookMyArtist acts strictly as a digital signing technology provider (like DocuSign); the contract is executed directly between the artist and client with zero platform liability or escrow holding.
* **Technical Implementation:**
  1. HTML5 Canvas mobile-responsive signature pad (`react-signature-canvas`).
  2. Standard Indian entertainment contract clauses: Call time, performance duration (e.g. 90 mins), soundcheck arrival, 50% non-refundable advance terms, force majeure, overtime hourly rates.
  3. Upon client signing, generates an immutable signed PDF with cryptographic hash, timestamp, and sends copies to both artist and client via WhatsApp and email.

---

### ⭐ Feature 1.5: Post-Event Automated Review & Rating Collector (WhatsApp Loop)
* **Problem Statement:** Artists often forget to ask wedding couples or corporate clients for reviews after an exhausting show, losing out on valuable social proof.
* **Value Proposition:** Boosts artist credibility with genuine 5-star ratings displayed proudly on their public portfolio and Google search results.
* **Technical Implementation:**
  1. Scheduled job triggers 24 hours after the event date recorded on an accepted booking.
  2. Automated WhatsApp message sent to the client:
     *"Hi Rohit! Hope your wedding was magical! How was DJ Aryan's performance last night? Click here to rate your experience (takes 10 seconds): [Link]"*
  3. Fast 5-star rating + 1-sentence review form. Submitted reviews immediately appear on the artist's portfolio under *"Verified Event Reviews"*.

---

### 🎛️ Feature 1.6: Stage Soundcheck & Tech Rider Checklist Generator
* **Problem Statement:** Musicians, Live Bands, and DJs face massive sound issues at venues because local sound vendors don't know the artist's technical requirements in advance.
* **Value Proposition:** Eliminates stage chaos. Artists can generate a professional 1-page "Technical Stage Rider" to share with sound engineers in 1 tap.
* **Technical Implementation:**
  1. Tech rider builder in `/portfolio` (Microphone types: Shure Beta 58A / Wireless Sennheiser, In-Ear Monitors, DJ Console model: Pioneer CDJ-3000 / DJM-900NXS2, Stage monitors count, DI boxes).
  2. One-tap *"Share Tech Rider on WhatsApp"* button that generates a crisp visual checklist for the sound engineer.

---

### 🚀 Feature 1.7: Featured Artist Directory Boost (Monetized Spotlight)
* **Problem Statement:** Top artists want maximum visibility and are willing to pay for premium placement above regular search results.
* **Value Proposition:** Additional recurring revenue stream for BookMyArtist; higher booking volume for top performers.
* **Technical Implementation:**
  1. Directory algorithm prioritizes "Featured / Spotlight" artists in top 3 slots for each category/city.
  2. Can be bundled with the Premium Plan (₹1,299/mo) or unlocked as an add-on boost.
  3. Displays a gold *"Featured Performer"* badge.

---

### 📶 Feature 1.8: Offline Portfolio PWA Caching (Banquet Hall Offline Mode)
* **Problem Statement:** Luxury five-star hotel banquet halls, heritage forts, and farmhouses frequently have weak or zero cellular reception. When an artist meets a planner in person, their website fails to load.
* **Value Proposition:** The artist's portfolio opens instantly in offline mode without an internet connection, allowing them to showcase high-res photos, bio, and past show credentials anywhere.
* **Technical Implementation:**
  1. Enhanced Service Worker using Workbox / CacheStorage.
  2. Pre-caches the artist's critical profile JSON, hero imagery, compressed showreel video posters, and rate card.
  3. Detects `navigator.onLine === false` and smoothly serves cached assets with a sleek *"Offline Showcase Mode"* indicator.

---

### 📊 Feature 1.9: Artist Smart Analytics & Lead Intelligence
* **Problem Statement:** Artists want to know who is looking at their profile, which cities are generating the most interest, and where they should market themselves.
* **Value Proposition:** Empowers artists with actionable business intelligence so they feel the tangible value of BookMyArtist every week.
* **Technical Implementation:**
  1. Privacy-friendly event tracking for profile views, showreel video plays, WhatsApp clicks, and quotation downloads.
  2. Interactive charts in `/analytics`: Visitor geographic breakdown (e.g. 58% Mumbai, 25% Pune, 17% Delhi), lead conversion rate, and peak viewing days.
  3. Weekly summary push notification: *"Your portfolio was viewed by 76 event planners this week! 3 wedding inquiries generated."*

---

## 🟡 Phase 2: Creative Portfolio & Media Expansion (Pending)

> **Context:** Rich audio/media tools and creative styling to expand multi-artist capabilities.

---

## 🎧 Feature 6: Audio & Stream Embeds for Multi-Artist Expansion

### Problem Statement:
With BookMyArtist serving all artists including DJs, Singers, Bands, and Voiceover Artists, video embeds alone are not enough. Musicians and DJs need to showcase their mixtapes, original compositions, and audio reels directly on their portfolios.

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
Event planners and wedding couples rarely hire an artist in isolation; they book an entire entertainment package (e.g. Emcee + DJ + Live Band + Sound Setup).

### Value Proposition:
Allows artists to cross-promote each other and accept bundled inquiries.

### Technical Implementation:
1. **Artist Crews / Collectives:**
   - Allow artists to link partner DJs or photographers to their profile as "Recommended Crew".
2. **Bundled Inquiries:**
   - Inquiry form includes checkboxes: *"Do you also need a DJ or Live Band for this event?"*
   - Automatically duplicates the lead and alerts the partner artists on BookMyArtist.

---

## 🧠 Feature 9: AI Portfolio Bio & Repertoire Assistant

### Problem Statement:
Many talented performers struggle to write compelling, high-converting bios and stage introductions for their portfolios.

### Value Proposition:
1-click AI bio writer that creates punchy, professional elevator pitches tailored for weddings, corporate summits, and concerts.

### Technical Implementation:
1. **Integration:**
   - Lightweight integration with Google Gemini API via Supabase Edge Function or Next.js server action.
2. **User Input:**
   - Artist inputs 3 bullet points: Years of experience, notable brands/events hosted, signature style (Energetic, Humorous, Sophisticated).
3. **Output:**
   - Generates 3 polished bio variations (Short elevator pitch, Detailed corporate profile, Luxury wedding bio).

---

## 🟣 Phase 3: Viral Referral Engine & Growth Expansion (Future Scope)

> **Context:** Added upon user request as strategic future scope to transform BookMyArtist into India's fastest-growing organic artist network. To be reviewed and prioritized for development in Phase 3.

---

### 🎁 Feature 10: Two-Sided "Give & Get" Referral Incentives
* **Concept:** Currently, only the inviting artist receives perks. Under "Give & Get", the invited newcomer ALSO receives an exclusive welcome gift (e.g. 15 Days Free Pro Trial or ₹200 off their first subscription).
* **Conversion Impact:** Conversion rate jumps 3x–5x because the invite feels like an exclusive gift from a respected colleague rather than marketing.
* **Implementation Plan:**
  1. On `/register?ref=slug`, display: *"🎁 Rahul Sharma has gifted you a 15-Day Free Pro Trial!"*
  2. Upon signup, credit 15 days of Pro status to the new user and queue +30 days for the referrer.

---

### ⚡ Feature 11: Real-Time WhatsApp & Email Referral Alerts (Dopamine Loop)
* **Concept:** The exact second a fellow artist registers using someone's invite link, an automated WhatsApp alert and email are fired to the referrer.
* **Message Template:**
  ```text
  🎉 *GREAT NEWS, {{artist_name}}!* 🎉
  
  Singer Aarti Verma has just registered on BookMyArtist using your personal invite link!
  
  🎁 *Reward Credited:* +30 Days Pro Validity
  🏆 *New Community Rank:* #3 on the Leaderboard
  
  Invite 2 more artists to unlock the Silver Ambassador Badge!
  👉 https://bookmyartist.in/referrals
  ```
* **Psychological Impact:** Instant gratification stimulates the referrer to share with 5 more peers immediately.

---

### 🏆 Feature 12: Ambassador Milestone Tiers & Prestige Badges
* **Concept:** Live performers and anchors value industry prestige and verified authority. Gamified tiers fuel competitive pride on the community leaderboard.
* **Milestone Structure:**
  - **🥉 Bronze Ambassador (3 Invites):** Verified Community Ambassador Badge on their public stage & directory card.
  - **🥈 Silver Ambassador (5 Invites):** 1 Month Homepage Hero Spotlight ("Artist of the Month").
  - **🥇 Gold Legend (10+ Invites):** Lifetime Free Pro Plan + First Priority for inbound direct corporate event inquiries.

---

### 📸 Feature 13: 1-Click Instagram & WhatsApp Story Card Generator
* **Concept:** Artists live on Instagram Stories and WhatsApp Statuses. Provide a 1-tap branded visual poster generator.
* **Output Specs:** High-res 9:16 vertical poster (1080x1920) formatted for stories:
  - Artist profile photo & stage name in neon aesthetic
  - "Check out my official live portfolio on BookMyArtist"
  - Embedded high-res QR code leading directly to their `/register?ref=slug` URL
  - One-tap "Save Story Poster" or "Share to WhatsApp Status" button.

---

### ⚙️ Feature 14: Automated Subscription Validity Extension Engine
* **Concept:** Eliminate manual admin review for validity rewards.
* **Workflow:**
  1. Invited artist creates account and marks their profile complete (photo + at least 1 video showreel + bio).
  2. Background webhook or server action automatically queries `subscriptions` for the referrer.
  3. Increments `current_period_end` by `settings.reward_value` (e.g. 30 days) in PostgreSQL.
  4. Records timestamp in `referrals.rewarded_at` and triggers confirmation notifications.

---

### 💳 Feature 15: Artist Cash Wallet & Instant UPI Withdrawal Engine
* **Concept:** If Admin toggles "Cash / Money" mode (e.g. ₹500 per verified artist referral):
* **Workflow:**
  1. User Dashboard displays live **"Referral Earnings Wallet (₹)"** balance.
  2. Artist inputs their UPI VPA (e.g., `artistname@upi` or `9876543210@paytm`).
  3. Artist clicks "Request UPI Payout".
  4. Admin panel includes a 1-click **Razorpay Payouts API** integration (or manual "Mark Paid with Bank UTR Number").

---

### 🤝 Feature 16: Client & Event Planner Referral Loop
* **Concept:** Expand referrals beyond artists to event planners and wedding organizers.
* **Workflow:**
  - After a client books an artist through a digital receipt (`/receipt/[id]`):
  - Confirmation screen displays: *"Know another event organizer or couple planning a wedding? Share BookMyArtist and both get ₹500 credit on your next artist booking!"*
  - Creates a self-reinforcing B2B viral loop among event management companies and corporate planners.

---

## 🏁 Summary: Execution Priority Matrix

### 💳 Priority 0 (Live Setup)
| Feature | Target Audience | Effort | Business Impact | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Razorpay Live Merchant Integration** | All Users | Low | 🔴 Critical (Revenue & Monetization) | **Immediate / Live KYC** |

### 🔵 Phase 1: Core Platform Superchargers (High-Priority Upgrades)
| Feature | Target Audience | Effort | Business Impact | Status / Target Sprint |
| :--- | :--- | :--- | :--- | :--- |
| **City + Category SEO Landing Pages** | Google Search / Organic Clients | Medium | 🟢 Massive (Zero-ad organic client leads) | **Sprint 1** |
| **Directory Date & City Availability Filter** | Event Planners & Organizers | Low | 🟢 High (Instant booking convenience) | **Sprint 2** |
| **1-Click Verified WhatsApp Inquiries** | High-Profile Artists | Low | 🟢 High (Blocks fake/spam inquiries) | **Sprint 3** |
| **Digital Performance Agreement (E-Sign)** | All Performing Artists | Medium | 🟢 Massive (Protects artist dates & fees) | **Sprint 4** |
| **Post-Event Automated Review Collector** | Clients & Past Event Hosts | Low | 🟢 High (Builds social proof on autopilot) | **Sprint 5** |
| **Stage Soundcheck & Tech Rider Generator** | Musicians, Live Bands, DJs | Low | 🟡 Medium (Eliminates venue sound chaos) | **Sprint 6** |
| **Featured Artist Directory Boost** | Premium Tier Artists | Low | 🟢 High (Direct platform revenue boost) | **Sprint 7** |
| **Offline Portfolio PWA Caching** | Traveling Artists in Venues | Medium | 🟡 Medium (Instant loads in banquet basements) | **Sprint 8** |
| **Artist Smart Analytics & Lead Intelligence** | Dashboard Users | Medium | 🟡 Medium (Weekly value demonstration) | **Sprint 9** |

### 🟡 Phase 2: Creative Portfolio & Media Expansion (Pending)
| Feature | Target Audience | Effort | Business Impact | Status / Target Sprint |
| :--- | :--- | :--- | :--- | :--- |
| **Audio & Mixtape Embeds (Spotify/SoundCloud)** | DJs, Singers, Musicians | Low | 🟢 High (Deepens multi-artist adoption) | **Phase 2 Scope** |
| **Gig Repertoire & Tech Rider Builder** | Musicians & DJs | Medium | 🟡 Medium (Professionalism boost) | **Phase 2 Scope** |
| **Multi-Artist Booking Bundles (Agency Mode)** | Event Planners & Crews | High | 🟢 High (Increases booking volume) | **Phase 2 Scope** |
| **AI Bio & Repertoire Assistant** | All Artists | Low | 🟡 Medium (Onboarding conversion) | **Phase 2 Scope** |
| **🦁 Brand Mascot — "BMA Lion"** | Brand & Marketing | Low | 🟡 Medium (Brand memorability) | **Phase 2 Scope** |

### 🟣 Phase 3: Viral Referral Engine & Growth Expansion (Future Scope)
| Feature | Target Audience | Effort | Business Impact | Status / Target Sprint |
| :--- | :--- | :--- | :--- | :--- |
| **Two-Sided "Give & Get" (15-Day Trial Gift)** | New & Existing Artists | Low | 🟢 High (3x-5x invite conversion) | **Phase 3 (Pending Your Decision)** |
| **Real-Time WhatsApp & Email Referral Alerts** | Inviting Artists | Medium | 🟢 High (Instant dopamine loop) | **Phase 3 (Pending Your Decision)** |
| **Ambassador Milestone Tiers (Bronze/Silver/Gold)** | Top Referrers | Low | 🟡 Medium (Prestige & gamification) | **Phase 3 (Pending Your Decision)** |
| **1-Click Instagram & WhatsApp Story Poster** | Social Creators | Medium | 🟢 High (Viral visual sharing) | **Phase 3 (Pending Your Decision)** |
| **Automated Subscription Validity Auto-Credit** | Pro/Premium Artists | Low | 🟡 Medium (Zero admin intervention) | **Phase 3 (Pending Your Decision)** |
| **Artist Cash Wallet & Instant UPI Withdrawal** | Cash Earning Artists | High | 🟢 High (Monetary incentive loop) | **Phase 3 (Pending Your Decision)** |
| **Client & Event Planner Referral Loop** | Organizers / Clients | Medium | 🟢 High (B2B organic acquisition) | **Phase 3 (Pending Your Decision)** |

---

## 🦁 Brand Mascot — "BMA Lion"
**Status:** 💡 Idea — Concepts Ready | **Priority:** Low | **Sprint:** TBD

A lion mascot to give BookMyArtist a memorable brand personality — "King of the Stage" energy.

### Concept Designs (Generated)
| Version | Style | Description |
|---------|-------|-------------|
| **V1 "The Host"** | Formal | Purple suit, bow-tie, holding microphone — classic stage performer |
| **V2 "The Manager"** | Casual/Cool | Sunglasses, purple jacket, rock-on gesture + smartphone — tech-savvy vibe |

### Potential Use Cases
- Landing page hero or empty states
- Onboarding flow guide character
- Error pages (404, 500) — friendly error companion
- Loading animations / skeleton screens
- WhatsApp sticker pack for artist engagement
- Social media content & reels
- Email campaign illustrations
- Favicon / app icon variant

### Name Ideas
Simba · Roary · Leo · Staggy · Arty

---

*Last Updated: October 2026 — Verified against live codebase, Supabase database, and production build.*
