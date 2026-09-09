# 🚀 StageHost — Future Implementation Roadmap & Technical Specification

> **Purpose:** This document details the strategic, architectural, and feature roadmap for StageHost. Any software engineer, product manager, or technical lead can reference this document to understand what needs to be built next, why it matters, and how to implement it.

---

## 🗺️ Roadmap Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   STAGEHOST EVOLUTION ROADMAP                                    │
├───────────────────────┬───────────────────────┬──────────────────────────┬───────────────────────┤
│    Phase 1: High ROI  │   Phase 2: CRM Power  │    Phase 3: Automation   │ Phase 4: Enterprise   │
│  White-Label & Media  │   Proposals & Social  │      WhatsApp & 2-Way    │ PWA & Multi-Market    │
├───────────────────────┼───────────────────────┼──────────────────────────┼───────────────────────┤
│ 1. Custom Domains     │ 3. PDF Proposal       │ 5. Meta WhatsApp Cloud   │ 7. Mobile PWA & Push  │
│    (anchorname.com)   │    Rate Card Gen      │    Automated API         │    Notifications      │
│ 2. Client-side WebP   │ 4. Google / Social    │ 6. Two-Way Google        │ 8. GST Invoicing      │
│    Media Compression  │    1-Click Auth       │    Calendar Sync         │    Engine for Subs    │
└───────────────────────┴───────────────────────┴──────────────────────────┴───────────────────────┘
```

---

## 🌐 Feature 1: Custom Domains Multi-Tenant White-Labeling

### Problem Statement:
Top-tier celebrity anchors and corporate emcees charge ₹50,000 to ₹2,00,000+ per event. They want to brand their own domain (e.g. `https://priyapatel.live` or `https://rahulsharma.com`) rather than sending `stagehost.in/rahulsharma`.

### Value Proposition:
- Major upsell trigger for the **Premium Plan (₹1,299/mo)**.
- Full white-label experience while StageHost silently powers the backend CRM, scheduling, and forms.

### Architecture & Implementation Plan:
1. **DNS Architecture:**
   - Anchor adds a `CNAME` record in GoDaddy / Cloudflare pointing to `cname.stagehost.in`, or an `A` record pointing to StageHost's server IP (`76.76.21.21`).
2. **Next.js Middleware Routing:**
   - In Next.js middleware / proxy:
     ```ts
     // Extract Hostname
     const hostname = request.headers.get('host') || '';
     // If host is custom (not stagehost.in or localhost)
     if (!hostname.includes('stagehost.in') && !hostname.includes('localhost')) {
       // Look up profile slug for this custom domain in cache/DB
       const slug = await getSlugForCustomDomain(hostname);
       if (slug) {
         // Rewrite to internal portfolio route
         return NextResponse.rewrite(new URL(`/${slug}${request.nextUrl.pathname}`, request.url));
       }
     }
     ```
3. **Automated SSL:**
   - Integrate Vercel Domains API (`POST /v1/domains`) or Cloudflare for SaaS (SSL for Custom Hostnames) to auto-provision Let's Encrypt certificates within 60 seconds of DNS propagation.
4. **Admin Panel Status:**
   - Admin settings already contains the **Custom Domains & DNS Verification** table (`SettingsFormClient.tsx`). Wire the "Approve" button to trigger the domain registration API.

---

## 🤖 Feature 2: Meta WhatsApp Cloud API (Automated Instant Ping)

### Problem Statement:
Right now, inquiries arrive via email and the anchor can click `wa.me` links to reply. However, anchors are often busy on stage, backstage, or traveling. A lead that isn't answered in the first 15 minutes has an 80% lower chance of conversion.

### Value Proposition:
Instant automated delivery directly into the anchor's WhatsApp personal chat the moment a client presses "Submit Inquiry".

### Technical Implementation:
1. **Meta WhatsApp Business Platform Integration:**
   - Setup Meta Developer App with WhatsApp Cloud API enabled.
   - Configure Webhook listener at `/api/whatsapp/webhook`.
2. **Pre-approved WhatsApp Template (`inquiry_alert_v1`):**
   ```
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
3. **Trigger Workflow:**
   - Inside `src/lib/actions/inquiries.ts` `submitInquiry()`:
   - Check if the anchor has phone notifications enabled.
   - Make a `POST` request to `https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages` with the template payload.

---

## 📄 Feature 3: Automated PDF Quotation & Rate Card Generator

### Problem Statement:
Corporate event planners (Google, Amazon, TCS) and high-end wedding agencies require formal **PDF Quotation Proposals & Rate Cards** with letterheads and commercial terms before approving an anchor's booking. Currently anchors manually create these in Word or Canva.

### Value Proposition:
Anchor can click **"Generate PDF Quote"** from any lead in `/inquiries`, enter agreed amount, and download a pixel-perfect, branded PDF proposal in 5 seconds.

### Technical Implementation:
1. **Library Selection:**
   - Use `@react-pdf/renderer` or Next.js HTML-to-PDF serverless pipeline.
2. **PDF Template Elements:**
   - Anchor Stage Photo, Name, Verified Badge, and Contact info on top header.
   - Client event details: Date, Venue, City, Event Category.
   - Itemized Scope of Work:
     - Pre-event coordination meeting & briefing.
     - Stage hosting, crowd engagement & artist introductions.
     - Rehearsals & run-throughs.
   - Commercial Quotation Breakdown: Base fee + Outstation travel/accommodation note.
   - Payment Milestones: 50% Advance on confirmation, 50% on event date before stage entry.
   - Terms & Cancellation Policy.
3. **Sharing:**
   - 1-click button: **"Download PDF"** and **"Send PDF via WhatsApp"**.

---

## 🔄 Feature 4: Two-Way Google Calendar Real-Time Sync

### Problem Statement:
StageHost currently supports 1-way iCal export (`/api/calendar/[slug]`). If an anchor adds an event in StageHost, it shows in Apple/Google Calendar. But if an anchor adds a family vacation or personal shoot in their Google Calendar, StageHost does not automatically block that date.

### Value Proposition:
Zero double-booking risk. StageHost's public portfolio calendar automatically shows dates as **"Booked"** if the host is busy in their personal Google Calendar.

### Technical Implementation:
1. **Google OAuth Scope:**
   - Request `https://www.googleapis.com/auth/calendar.readonly` or `events`.
   - Store OAuth `refresh_token` securely in Supabase `anchor_settings` table.
2. **Google Calendar Webhook / Watch API:**
   - Register a webhook channel (`calendar.events.watch`).
   - When Google fires a webhook on calendar change, StageHost queries Google Calendar API for updated busy ranges and creates or updates `schedule_slots` with `status: 'booked'`.
3. **Privacy Protection:**
   - Only sync the busy time slot. Personal meeting titles (e.g. "Doctor appointment") are masked as "Engaged / Private Booking" to protect host privacy.

---

## 🖼️ Feature 5: Client-Side Media Compression (WebP Pipeline)

### Problem Statement:
Anchors routinely upload 15MB–25MB raw photographs taken by event photographers. Directly uploading these:
- Fills Supabase storage quotas fast.
- Dramatically slows down the anchor's public portfolio on mobile 4G networks in India.

### Technical Implementation:
1. **Browser Compression via HTML5 Canvas or `browser-image-compression`:**
   - Before firing `supabase.storage.upload()`:
   - Resize dimensions to maximum width 1920px (full HD).
   - Convert output MIME type to `image/webp` with quality factor `0.82`.
   - Reduces a 15MB JPEG to ~250KB WebP with zero noticeable loss in visual clarity.
2. **Responsive Image Sizes:**
   - Generate a thumbnail (`400x400` WebP) for directory cards and mobile previews.

---

## 🔑 Feature 6: One-Click Social Authentication (Google & Apple OAuth)

### Problem Statement:
Traditional email/password authentication creates friction during signup and leads to forgotten passwords.

### Technical Implementation:
1. **Supabase Auth Social Providers:**
   - Enable Google Cloud OAuth credentials in Supabase Dashboard.
   - Add Apple Developer Services ID for iOS safari users.
2. **Frontend UI:**
   - In `/login` and `/register`, add:
     - `Continue with Google` (with standard Google G SVG icon).
     - Standard separation divider (`OR`).
3. **Automatic Profile Provisioning:**
   - Upon first Google login, extract `user.user_metadata.full_name` and `avatar_url` to pre-fill the anchor's profile and generate their stage slug automatically.

---

## 💳 Feature 7: Automated GST Tax Invoice Generation for Subscriptions

### Problem Statement:
Indian anchors who register as Sole Proprietorships or LLPs have GST numbers. When they subscribe to Pro (₹599) or Premium (₹1299), they require a GST-compliant tax invoice PDF to claim input tax credit (ITC) and record accounting expenses.

### Technical Implementation:
1. **Tax Information Collection:**
   - In `/settings`, allow anchors to add their Registered Business Name, GSTIN, and Billing Address.
2. **Invoice Generation upon Razorpay Webhook:**
   - In `/api/payment/webhook/route.ts`:
   - When `payment.captured` arrives, compute CGST 9% + SGST 9% (or IGST 18%).
   - Generate sequential invoice number (e.g. `INV-2026-0042`).
   - Store downloadable PDF in Supabase Storage `invoices/` bucket.
   - Show a "Download Tax Invoice" button in the Anchor's Billing history tab.

---

## 📱 Feature 8: Mobile Progressive Web App (PWA) & Push Notifications

### Problem Statement:
Anchors are constantly on the road between hotels, venues, and airports. They prefer opening StageHost like an app from their home screen rather than typing URLs in Chrome/Safari.

### Technical Implementation:
1. **Web App Manifest (`public/manifest.json`):**
   - Brand icon, theme color (`#0a0a14`), standalone display mode.
2. **Service Worker (`sw.js`):**
   - Cache shell assets for instantaneous offline launch.
3. **Web Push Notifications:**
   - Send device push notifications when a new client inquiry is received or an event reminder is due.

---

---

## 🎭 Feature 9: Universal Multi-Artist Platform Expansion (DJs, Singers, Bands, Standup Comedians, Dancers)

### Problem Statement:
While StageHost originated as a dedicated platform for Anchors and Emcees, the live entertainment ecosystem includes DJs, Singers, Live Bands, Standup Comedians, Dancers, Magicians, Keynote Speakers, Voiceover Artists, and Photographers who share the exact same pain points:
1. Fragmented social profiles (Instagram links, scattered YouTube reels).
2. Unprofessional pricing negotiations via WhatsApp screenshots.
3. Lack of a unified high-converting media showcase with audio/video/repertoire embeds.

### Value Proposition:
- 10x Total Addressable Market (TAM): Expands user base from ~50,000 professional emcees to 500,000+ performing artists across India.
- Cross-artist networking & agency booking packages (e.g. Wedding planners hiring Anchor + DJ + Live Band together).

### Implemented Foundation:
1. **Taxonomy & Metadata:**
   - Centralized `ARTIST_CATEGORIES` in `src/constants/artists.ts` covering 11 categories:
     `emcee`, `dj`, `singer`, `musician`, `standup`, `dancer`, `magician`, `speaker`, `voiceover`, `photographer`, `celebrity`.
   - Dynamic badge helper functions for plural/singular titles and badges across all UI components.
2. **Directory Multi-Artist Browsing (`/directory`):**
   - Quick category pill filter bar ("All Artists", "🎤 Emcee", "🎧 DJ", "🎵 Singer", etc.).
   - Type-aware badges on artist cards and fallback data showcasing various artist types.
3. **Portfolio Category Selection (`/portfolio`):**
   - Artist Category & Profession dropdown in basic information.
   - Backward-compatible profile action fallback syncing with `auth.user_metadata` even before Supabase SQL migration runs.
4. **Database Migration Script:**
   - Ready-to-execute SQL in `supabase/add_artist_type_column.sql`.

### Next Evolution Steps for Multi-Artist:
1. **Audio Embeds Support (Singers, DJs, Musicians, Voiceover):**
   - Add SoundCloud, Spotify, Apple Music, and Mixcloud widget embeds to the portfolio media showcase.
2. **Gig Repertoire & Setlist Builder:**
   - Allow singers and DJs to list genres (Bollywood, Sufi, Retro 90s, EDM, Commercial) and signature tracks.
3. **Multi-Artist Booking Packages:**
   - Event planners can create a single inquiry bundle for Anchor + DJ + Photographer for a wedding or corporate summit.

---

## 🏁 Summary: Execution Priority Matrix

| Feature | Effort | Business Impact | Recommended Sequence |
| :--- | :--- | :--- | :--- |
| **Universal Multi-Artist Architecture** | Low/Medium | 🟢 Massive (10x TAM Expansion to All Artists) | **Ready / Active** |
| **Custom Domains (`anchorname.com`)** | Medium | 🟢 High (Drives ₹1299 Premium plan) | **Sprint 1** |
| **PDF Quotation / Rate Card Generator** | Medium | 🟢 High (Daily utility for anchors/artists) | **Sprint 2** |
| **Client-Side Image Compression** | Low | 🟢 High (Infrastructure & Speed) | **Sprint 3** |
| **Google 1-Click Login** | Low | 🟡 Medium (Reduces signup drops) | **Sprint 4** |
| **Meta WhatsApp Cloud API** | High | 🟢 High (Fastest lead response) | **Sprint 5** |
| **2-Way Google Calendar Sync** | High | 🟡 Medium (Calendar power users) | **Sprint 6** |
| **GST Tax Invoices for Subscriptions** | Medium | 🟡 Medium (Compliance & Pro users) | **Sprint 7** |
| **PWA & Mobile Push Notifications** | Medium | 🟡 Medium (Long-term retention) | **Sprint 8** |

