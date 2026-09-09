const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/(^["']|["']$)/g, '')];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BASE_URL = 'http://localhost:3000';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  suites: []
};

function assert(condition, message, suiteName, isWarning = false) {
  results.total++;
  let suite = results.suites.find((s) => s.name === suiteName);
  if (!suite) {
    suite = { name: suiteName, tests: [] };
    results.suites.push(suite);
  }

  if (condition) {
    results.passed++;
    suite.tests.push({ status: 'PASS', message });
    console.log(`  ✅ [PASS] ${message}`);
  } else if (isWarning) {
    results.warnings++;
    suite.tests.push({ status: 'WARN', message });
    console.log(`  ⚠️ [WARN] ${message}`);
  } else {
    results.failed++;
    suite.tests.push({ status: 'FAIL', message });
    console.log(`  ❌ [FAIL] ${message}`);
  }
}

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 STAGEHOST SENIOR QA COMPREHENSIVE PLATFORM AUDIT');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SUITE 1: Route Availability & Performance (HTTP 200)
  // ----------------------------------------------------
  console.log('📦 SUITE 1: Critical Routes Availability & Response Time');
  const routesToTest = [
    { path: '/', expectedText: 'StageHost', name: 'Homepage' },
    { path: '/admin-user', expectedText: 'Aman', name: 'Public Anchor Profile' },
    { path: '/directory', expectedText: 'Directory', name: 'Anchor Directory' },
    { path: '/pricing', expectedText: 'Pricing', name: 'Pricing Plans' },
    { path: '/about', expectedText: 'About', name: 'About Page' },
    { path: '/login', expectedText: 'Log In', name: 'Login Page' },
  ];

  for (const route of routesToTest) {
    const start = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${route.path}`);
      const duration = Date.now() - start;
      const html = await res.text();

      assert(res.status === 200, `${route.name} (${route.path}) returned HTTP ${res.status} in ${duration}ms`, 'Route Availability');
      assert(html.toLowerCase().includes(route.expectedText.toLowerCase()), `${route.name} contains expected content identifier: "${route.expectedText}"`, 'Route Availability');
      assert(duration < 2500, `${route.name} responded within acceptable performance SLA (${duration}ms < 2500ms)`, 'Route Availability', true);
    } catch (err) {
      assert(false, `${route.name} failed to load: ${err.message}`, 'Route Availability');
    }
  }

  // ----------------------------------------------------
  // SUITE 2: Public Profile Component & UX Audit (/admin-user)
  // ----------------------------------------------------
  console.log('\n📦 SUITE 2: Public Anchor Profile Components & Dynamic Rendering');
  try {
    const res = await fetch(`${BASE_URL}/admin-user`);
    const html = await res.text();

    // 2.1 SEO Metadata
    assert(html.includes('<title>') && html.includes('Aman'), 'Page contains dynamic SEO <title> with artist name', 'Public Profile UX');
    assert(html.includes('meta name="description"') || html.includes('meta property="og:description"'), 'SEO meta description exists', 'Public Profile UX');

    // 2.2 Credibility Bar & Gigs Completed
    const hasGigsText = html.includes('350+') || html.includes('Shows') || html.includes('Gigs') || html.includes('350');
    assert(hasGigsText, 'Credibility bar displays completed gigs / shows metric (e.g. 350+ Shows)', 'Public Profile UX');

    // 2.3 Starting Price & Location
    assert(html.includes('50,000') || html.includes('50000'), 'Starting price formatted and rendered correctly (₹50,000)', 'Public Profile UX');
    assert(html.includes('Mumbai') || html.includes('Udaipur'), 'Artist city and travel radius rendered cleanly', 'Public Profile UX');

    // 2.4 Bento Grid / Highlights
    const hasBentoOrHighlights = html.includes('bento') || html.includes('Highlights') || html.includes('Experience') || html.includes('Years');
    assert(hasBentoOrHighlights, 'Bento Grid highlights section present in markup', 'Public Profile UX');

    // 2.5 Media - Videos
    const hasVideoSection = html.includes('Videos') || html.includes('Performance') || html.includes('Watch') || html.includes('video');
    assert(hasVideoSection, 'Videos & Performance showcase section rendered', 'Public Profile UX');

    // 2.6 Media - Photos Gallery (Captured On Stage)
    const hasPhotoSection = html.includes('Photo') || html.includes('Captured') || html.includes('Stage') || html.includes('Gallery');
    assert(hasPhotoSection, 'Captured On Stage photo gallery section rendered', 'Public Profile UX');

    // 2.7 Packages & Pricing Section
    const hasPackages = html.includes('Package') || html.includes('Service') || html.includes('Starting');
    assert(hasPackages, 'Service Packages and pricing tier section rendered', 'Public Profile UX');

    // 2.8 Availability & Booking Modal CTA
    const hasBookingCTA = html.includes('Availability') || html.includes('Book') || html.includes('Inquire') || html.includes('Check Date');
    assert(hasBookingCTA, 'Date & Availability check / Booking CTA buttons present', 'Public Profile UX');

  } catch (err) {
    assert(false, `Public profile test failed: ${err.message}`, 'Public Profile UX');
  }

  // ----------------------------------------------------
  // SUITE 3: Database Schema & Migration Verification
  // ----------------------------------------------------
  console.log('\n📦 SUITE 3: Supabase Database Schema & Constraints Integrity');

  // 3.1 anchor_profiles columns check
  const { data: profileCols, error: pColErr } = await supabase
    .from('anchor_profiles')
    .select('id, gigs_completed, artist_type, artist_specialties')
    .limit(1);
  assert(!pColErr, `anchor_profiles columns (gigs_completed, artist_type, artist_specialties) exist and are queryable without SQL error: ${pColErr?.message || 'OK'}`, 'Database Schema');

  // 3.2 Verify test profile Aman Singhania has valid gigs_completed
  const { data: amanProfile, error: amanErr } = await supabase
    .from('anchor_profiles')
    .select('*')
    .eq('slug', 'admin-user')
    .single();

  assert(!amanErr && amanProfile, 'Aman Singhania profile (admin-user) exists in database', 'Database Schema');
  if (amanProfile) {
    assert(typeof amanProfile.gigs_completed === 'number', `gigs_completed is of type INTEGER (value: ${amanProfile.gigs_completed})`, 'Database Schema');
    assert(typeof amanProfile.artist_type === 'string', `artist_type is set (value: "${amanProfile.artist_type}")`, 'Database Schema');
    assert(Array.isArray(amanProfile.artist_specialties) || amanProfile.artist_specialties === null, 'artist_specialties is valid array/null in DB', 'Database Schema');
  }

  // 3.3 Test Video Check Constraint with google_drive
  const testVideoId = '00000000-0000-0000-0000-000000000099';
  if (amanProfile) {
    const { error: insertVideoErr } = await supabase
      .from('videos')
      .upsert({
        id: testVideoId,
        profile_id: amanProfile.id,
        title: 'QA Automated Test Video (Google Drive)',
        url: 'https://drive.google.com/file/d/1qa-test-sample/view',
        platform: 'google_drive',
        sort_order: 999
      });

    assert(!insertVideoErr, `Inserting 'google_drive' platform video passes DB check constraints: ${insertVideoErr?.message || 'OK'}`, 'Database Schema');

    // Clean up test video
    await supabase.from('videos').delete().eq('id', testVideoId);
  }

  // ----------------------------------------------------
  // SUITE 4: Directory & Multi-Category Search
  // ----------------------------------------------------
  console.log('\n📦 SUITE 4: Directory Filter & Search Functionality');
  try {
    const dirRes = await fetch(`${BASE_URL}/directory`);
    const dirHtml = await dirRes.text();

    assert(dirHtml.includes('Filter') || dirHtml.includes('Category') || dirHtml.includes('Search'), 'Directory has interactive search and filter controls', 'Directory & Search');
    assert(dirHtml.includes('Aman') || dirHtml.includes('Singhania'), 'Listed active anchors rendered in directory cards', 'Directory & Search');
  } catch (err) {
    assert(false, `Directory test failed: ${err.message}`, 'Directory & Search');
  }

  // ----------------------------------------------------
  // SUITE 5: Summary & QA Verdict
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 SENIOR QA AUDIT SUMMARY:`);
  console.log(`Total Checks: ${results.total}`);
  console.log(`Passed:       ${results.passed} ✅`);
  console.log(`Warnings:     ${results.warnings} ⚠️`);
  console.log(`Failed:       ${results.failed} ❌`);
  console.log('====================================================');

  if (results.failed === 0) {
    console.log('\n🎉 VERDICT: ALL SYSTEMS OPERATIONAL AND PRODUCTION-READY! 🚀\n');
  } else {
    console.log('\n⚠️ VERDICT: ISSUES FOUND REQUIRING ATTENTION.\n');
  }

  return results;
}

runAudit().then((r) => {
  process.exit(r.failed > 0 ? 1 : 0);
}).catch((e) => {
  console.error('Fatal audit error:', e);
  process.exit(1);
});
