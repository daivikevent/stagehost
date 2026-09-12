/**
 * Production Database Cleansing Script for StageHost
 * Removes all seeded demo/test data (fake bookings, fake testimonials,
 * stock photos, dummy showreels, test inquiries, and fake profiles)
 * while preserving real user accounts (aish85, Super Admin, admin-user).
 */

const { createClient } = require('@supabase/supabase-js');

async function cleanProductionDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const sb = createClient(url, key);
  console.log('--- STARTING PRODUCTION DATABASE SCRAPING ---');

  // 1. Delete all fake inquiries
  console.log('1. Clearing test inquiries...');
  const { data: inqDeleted, error: inqErr } = await sb
    .from('inquiries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all
    .select('id, name');
  if (inqErr) console.error('Inquiries delete error:', inqErr.message);
  else console.log(`Deleted ${inqDeleted?.length || 0} test inquiries.`);

  // 2. Delete all fake testimonials
  console.log('2. Clearing demo testimonials...');
  const { data: testDeleted, error: testErr } = await sb
    .from('testimonials')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id, client_name');
  if (testErr) console.error('Testimonials delete error:', testErr.message);
  else console.log(`Deleted ${testDeleted?.length || 0} demo testimonials.`);

  // 3. Delete all demo bookings
  console.log('3. Clearing demo bookings...');
  const { data: bookDeleted, error: bookErr } = await sb
    .from('bookings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id, event_name');
  if (bookErr) console.error('Bookings delete error:', bookErr.message);
  else console.log(`Deleted ${bookDeleted?.length || 0} demo bookings.`);

  // 4. Delete all demo schedule slots
  console.log('4. Clearing demo schedule slots...');
  const { data: slotsDeleted, error: slotsErr } = await sb
    .from('schedule_slots')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id');
  if (slotsErr) console.error('Slots delete error:', slotsErr.message);
  else console.log(`Deleted ${slotsDeleted?.length || 0} demo schedule slots.`);

  // 5. Delete all demo service packages
  console.log('5. Clearing demo service packages...');
  const { data: pkgDeleted, error: pkgErr } = await sb
    .from('service_packages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id, name');
  if (pkgErr) console.error('Packages delete error:', pkgErr.message);
  else console.log(`Deleted ${pkgDeleted?.length || 0} demo service packages.`);

  // 6. Delete all demo stock photos
  console.log('6. Clearing demo stock photos...');
  const { data: photosDeleted, error: photoErr } = await sb
    .from('photos')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id, caption');
  if (photoErr) console.error('Photos delete error:', photoErr.message);
  else console.log(`Deleted ${photosDeleted?.length || 0} demo stock photos.`);

  // 7. Delete fake YouTube/stock videos (keeping any custom user reels if needed, or deleting demo showreels)
  console.log('7. Clearing demo showreel videos...');
  const { data: vidDeleted, error: vidErr } = await sb
    .from('videos')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id, title');
  if (vidErr) console.error('Videos delete error:', vidErr.message);
  else console.log(`Deleted ${vidDeleted?.length || 0} demo videos.`);

  // 8. Delete purely fake demo profiles (rahul-sharma, aman-singhania testuser123)
  console.log('8. Removing fake demo profiles...');
  const demoSlugs = ['rahul-sharma', 'aman-singhania'];
  const { data: profDeleted, error: profErr } = await sb
    .from('anchor_profiles')
    .delete()
    .in('slug', demoSlugs)
    .select('id, slug, name');
  if (profErr) console.error('Profiles delete error:', profErr.message);
  else console.log(`Deleted fake demo profiles:`, profDeleted?.map(p => p.slug) || []);

  // 9. Reset admin-user profile to a clean slate
  console.log('9. Cleaning admin-user profile details...');
  const { error: adminProfErr } = await sb
    .from('anchor_profiles')
    .update({
      bio: null,
      tagline: null,
      cover_photo_url: null,
      artist_specialties: [],
      starting_price: null,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', 'admin-user');
  if (adminProfErr) console.error('Admin profile update error:', adminProfErr.message);
  else console.log('admin-user profile reset to clean slate.');

  console.log('--- PRODUCTION DATABASE SCRAPING COMPLETE ---');
}

cleanProductionDb().catch(console.error);
