# 🎤 StageHost — Complete Product Overview & Architecture Guide

> **Tagline:** The All-In-One Digital Portfolio, Mini-CRM & Booking Engine for Live Event Anchors, Emcees & Hosts.

---

## 📌 1. What is StageHost? (Executive Summary)

**StageHost** is a specialized SaaS platform designed specifically for the live entertainment industry — targeting **Event Anchors, Emcees, Wedding Hosts, Corporate Moderators, and Stage Presenters**.

### The Problem it Solves:
In India and globally, professional event anchors struggle with:
1. **Unprofessional Portfolios:** Sharing heavy PDFs or scattered Instagram/YouTube links over WhatsApp.
2. **Lead Leakage:** Inquiries coming from WhatsApp, phone calls, Instagram DMs, and referrals get lost in personal chats.
3. **Double Bookings:** No central public calendar to show verified availability for wedding seasons or corporate dates.
4. **Poor Client Conversion:** Clients cannot easily see rate cards, past verified reviews, video showreels, and verified badges in one unified link.

### The StageHost Solution:
StageHost gives every anchor a **stunning, high-converting public portfolio link** (`stagehost.in/[slug]`) paired with a **complete private Mini-CRM and Admin control system**:
- Showcase high-definition video showreels (YouTube & Google Drive), photos, and custom service packages.
- Live event availability calendar showing booked vs open dates.
- Instant 1-click WhatsApp lead routing + lead tracking pipeline.
- Verified client reviews engine.
- Rich luxury social sharing preview card on WhatsApp.

---

## 🏗️ 2. Core Platform Architecture

StageHost is built on a modern, ultra-fast server-driven architecture:

| Component | Technology | Why it Was Chosen |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.3.4 (App Router & Turbopack)** | Server Components for instant initial page loads and high SEO ranking for anchor names. |
| **Language** | **TypeScript 5** | Strict type safety across database schemas, APIs, and client states. |
| **Database & Auth** | **Supabase (PostgreSQL + Auth + Storage)** | Real-time row-level security, high-scale media storage, and relational queries. |
| **Styling** | **Vanilla CSS Modules** | Zero-runtime CSS overhead, custom theme tokens, and bespoke glassmorphism aesthetics. |
| **Payment Gateway**| **Razorpay SDK** | Seamless INR subscriptions (Starter ₹199, Pro ₹599, Premium ₹1299) with promo codes. |
| **Social Media Cards**| **`next/og` (Edge Image Generation)** | Generates dynamic 1200x630 branded image cards for WhatsApp previews on the fly. |

---

## 🧭 3. Detailed Module Breakdown

StageHost is split into **4 primary interconnected modules**:

```
                              ┌────────────────────────────────────────┐
                              │           STAGEHOST PLATFORM           │
                              └───────────────────┬────────────────────┘
                                                  │
         ┌───────────────────────┬────────────────┴───────────────┬──────────────────────┐
         ▼                       ▼                                ▼                      ▼
 🌐 Public Portfolio      👤 Anchor Dashboard              🔍 Public Directory    ⚙️ Super Admin Suite
   (Client Facing)           (Mini-CRM & Tools)              (Event Planners)       (Platform Owner)
   - Video Showreels         - Inquiries Pipeline            - City Search          - Overview & MRR
   - Rate Card Packages      - Manual Lead Add               - Event Type Filter    - Users & Bulk Actions
   - Live Calendar           - Calendar Schedule             - Verified Spotlight   - Impersonation Mode
   - 1-Click WhatsApp        - WhatsApp Quotes               - Instant Chat         - Promo Codes Engine
   - Verified Reviews        - Analytics & Views             - Direct Booking       - CSV Ledger Export
   - Dynamic OG Cards        - Coupon Upgrade                                       - Custom Domains & DNS
```

---

### Module 1: 🌐 The Public Portfolio (`/[slug]`)
Every registered anchor receives a personalized public profile (e.g. `stagehost.in/rahul-sharma`).

1. **Hero Section & Branding**:
   - High-resolution stage photo, stage name, primary location (e.g. *Mumbai, India*), languages spoken, experience badges, and verified badges.
   - Quick action buttons: **Book Emcee**, **Chat on WhatsApp**, and **Share Profile**.
2. **Video Showreels & Media Gallery**:
   - Supports native YouTube embed modals, YouTube Shorts, and Google Drive video links.
   - High-resolution photo gallery of past stage appearances.
3. **Service Packages & Commercials**:
   - Clear pricing tiers for Weddings, Sangeet, Corporate Galas, and College Fests with detailed bullet points.
4. **Live Availability & Tour Calendar**:
   - Interactive calendar showing *Available*, *Booked*, and *Travel Buffer* dates.
   - Prevents client date inquiries when the host is already engaged.
5. **Verified Client Reviews & Rating Engine**:
   - 5-Star verified client testimonials with event type and client designations.
   - **"Write a Review" Modal**: Past clients and wedding planners can directly leave ratings and reviews.
6. **Dynamic WhatsApp Social Share Card (`opengraph-image.tsx`)**:
   - When an anchor sends their link on WhatsApp, an eye-catching 1200x630 preview card renders automatically showing their photo, name, city, and 5-star rating.
7. **Mobile Sticky Quick-Action Bar**:
   - Floating dock on mobile screens with **WhatsApp (1-Click Chat)** and **Book / Check Date** for maximum conversion.

---

### Module 2: 👤 Anchor Dashboard & Private Mini-CRM
When an anchor logs into StageHost (`/dashboard`), they access a full private operations suite:

1. **Lead Management & CRM (`/inquiries`)**:
   - Two-column responsive CRM view: left side lists incoming leads, right side displays detailed client event specifics.
   - **Manual Lead Entry ("Add Offline Lead")**: Anchor can log phone call leads or direct Instagram DMs to centralize their entire event business.
   - **Kanban / Status Pipeline**: Track leads across `New` ➔ `Contacted` ➔ `Converted` ➔ `Lost`.
   - **1-Click WhatsApp Quote Generator**: Pre-formats polite pricing proposals and opens WhatsApp directly to chat with the client.
2. **Portfolio Builder (`/portfolio`)**:
   - Update bio, stage name, languages, cities, and profile headshots.
   - Manage video showreels, photo gallery, and service packages without touching code.
3. **Schedule & Calendar (`/schedule`)**:
   - Block personal dates, add booked gigs, set travel buffers.
   - Export 1-way iCal subscription feed (`/api/calendar/[slug]`) to sync with Apple Calendar or Google Calendar.
4. **Themes & Aesthetics (`/themes`)**:
   - Choose between custom design moods: *Midnight Velvet*, *Royal Gold*, *Neon Cyberpunk*, *Minimal Light*, and *Emerald Stage*.
5. **Business Analytics (`/analytics`)**:
   - Tracks portfolio pageviews, inquiries generated, WhatsApp clicks, and estimated booking conversion rate.
6. **Subscription & Plan Upgrades (`/settings`)**:
   - Interactive checkout modal with **Promo Code validation** (e.g. `EARLYBIRD50` for 50% discount) and Razorpay integration.

---

### Module 3: 🔍 Public Anchor Directory (`/directory`)
A searchable marketplace for event management companies, wedding planners, and corporate HRs:
- Filter anchors by **City** (Mumbai, Delhi, Bangalore, Jaipur, Goa, etc.).
- Filter by **Event Category** (Weddings, Corporate, Concerts, Sangeet).
- **Featured / Spotlight Badges**: Anchors boosted by admins appear right at the top.
- Direct 1-click buttons to view portfolio or open WhatsApp chat.

---

### Module 4: ⚙️ Super Admin Suite (`/admin`)
A high-powered platform administration control center (`admin@stagehost.in`):

1. **Platform Overview & MRR (`/admin/dashboard`)**:
   - Total registered anchors, active recurring MRR, paid subscribers, and directory listing count.
   - **Anchor Business Generation (Platform ROI)**: Calculates estimated deal volume and leads generated for hosts across India.
   - **1-Click Export Leads (CSV)**: Download all booking inquiries to CSV.
   - **Real-Time Activity Stream**: Live feed of signups, upgrades, and booking inquiries.
2. **Users & Anchors Management (`/admin/users`)**:
   - Search, filter by plan (Free, Starter, Pro, Premium), and filter by account status (Active / Inactive).
   - **Bulk Actions Floating Dock**: Multi-select anchors with checkboxes to **Bulk Activate**, **Bulk Suspend**, or **Export Selected to CSV**.
   - **Spotlight Boost**: Toggle `Featured` status with 1 click to pin anchors to the top of the public directory.
   - **Impersonation ("View As Anchor")**: Admin can securely enter any anchor's dashboard to troubleshoot or assist them, with an exit banner to return.
   - **1-Click Export Users to CSV**: Download full anchor contact and profile lists.
3. **Subscription Plans & Coupons (`/admin/plans`)**:
   - Edit pricing and package limits (videos, photos, themes, custom domain flags).
   - **Coupons Engine**: Create, toggle active status, and delete discount codes (`DISCOUNT50`, `LAUNCH100`).
4. **Payments & Revenue Ledger (`/admin/payments`)**:
   - Real-time transaction history with payment IDs, anchor names, amounts, statuses, and **1-Click Export Payments to CSV**.
5. **Global Platform Settings (`/admin/settings`)**:
   - Platform brand name, support email, razorpay keys, and SMTP email settings with live test email sender.
   - **Broadcast Announcement Banner**: Publish urgent banners or feature news across all anchor dashboards with live visual preview.
   - **Custom Domains & DNS Manager**: Displays CNAME / A-Record DNS targets (`cname.stagehost.in`) and allows approving/rejecting anchor domain requests.

---

## 💰 4. Pricing & Monetization Model

| Plan | Price (Monthly) | Key Features |
| :--- | :--- | :--- |
| **Free Tier** | **₹0 / mo** | 3 videos, 6 photos, 3 service packages, standard theme, StageHost footer branding. |
| **Starter Plan** | **₹199 / mo** | 10 videos, 20 photos, 10 packages, remove branding, 3 premium themes. |
| **Pro Plan** *(Most Popular)* | **₹599 / mo** | 30 videos, 60 photos, unlimited packages, full analytics dashboard, 5 themes, priority directory listing. |
| **Premium Plan** | **₹1299 / mo** | Unlimited videos & photos, custom domain support, all themes, top directory spotlight boost, priority support. |

---

## 🎯 5. Product Strengths & Competitive Advantage

1. **Hyper-Niche Focus**: Unlike generic website builders (Wix, Squarespace, Bio link tools like Linktree), StageHost is custom-tailored for stage hosts (showreels, live availability calendar, event packages, WhatsApp commercial quotes).
2. **Zero Learning Curve for Anchors**: Anchors don't need design or coding skills. Filling out a simple form generates a world-class portfolio.
3. **Conversion-Obsessed**: Designed around WhatsApp click-to-chat, because 95% of live event deals in India and Southeast Asia close directly over WhatsApp.
4. **Robust Admin Control**: Full audit logs, impersonation, bulk operations, and CSV ledgers ensure the platform can scale to thousands of artists seamlessly.
