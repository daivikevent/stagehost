const { createClient } = require('@supabase/supabase-js');

async function seed() {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    console.error('REFUSING TO SEED: Demo seeding is disabled in production. Set ALLOW_DEMO_SEED=true to override.');
    return;
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile, error: profErr } = await supabase
    .from('anchor_profiles')
    .select('id')
    .eq('slug', 'admin-user')
    .single();

  if (profErr || !profile) {
    console.error('Profile not found:', profErr);
    return;
  }

  const profileId = profile.id;
  console.log('Found profile ID:', profileId);

  // 1. Update Profile Information
  const { error: updateErr } = await supabase
    .from('anchor_profiles')
    .update({
      name: 'Aman Singhania',
      tagline: 'Celebrity Wedding & High-Octane Corporate Emcee',
      bio: 'With 8+ years and 650+ stages across India, Dubai, and Thailand, Aman Singhania brings magnetic stage energy, spontaneous humor, and seamless crowd engagement to luxury destination weddings, televised award galas, and global corporate summits. Fluent in Hindi, English, Marwari, and Gujarati with zero awkward silences guaranteed.',
      city: 'Mumbai & Udaipur',
      state: 'Maharashtra',
      languages: ['English', 'Hindi', 'Marwari', 'Gujarati'],
      event_types: ['Wedding', 'Sangeet', 'Corporate Gala', 'Reception', 'Product Launch', 'Conference'],
      profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      cover_photo_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80',
      phone: '9820198201',
      whatsapp_number: '919820198201',
      instagram_url: 'https://instagram.com/stagehost',
      youtube_url: 'https://youtube.com/@stagehost',
      website_url: 'https://stagehost.in',
      starting_price: 50000,
      experience_years: 8,
      artist_type: 'emcee',
      artist_specialties: ['gigs:650'],
      is_profile_complete: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId);

  if (updateErr) console.error('Error updating profile:', updateErr);
  else console.log('Profile updated successfully!');

  // 2. Clear and Insert Videos
  await supabase.from('videos').delete().eq('profile_id', profileId);
  const { error: vidErr } = await supabase.from('videos').insert([
    {
      profile_id: profileId,
      title: 'Grand Royal Sangeet Night Showreel — Taj Lake Palace, Udaipur',
      url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
      platform: 'youtube',
      thumbnail_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      sort_order: 1
    },
    {
      profile_id: profileId,
      title: 'High Energy Crowd Interaction & Groom Roasts — Fairmont Jaipur',
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      platform: 'youtube',
      thumbnail_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
      sort_order: 2
    },
    {
      profile_id: profileId,
      title: 'Global Tech Leadership Summit 2024 (1,200 Delegates) — Jio World Center',
      url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      platform: 'youtube',
      thumbnail_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
      sort_order: 3
    },
    {
      profile_id: profileId,
      title: 'Luxury Varmala Reveal & Reception Hosting — Leela Palace, Udaipur',
      url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      platform: 'youtube',
      thumbnail_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
      sort_order: 4
    }
  ]);
  if (vidErr) console.error('Error inserting videos:', vidErr);
  else console.log('Videos inserted!');

  // 3. Clear and Insert Photos
  await supabase.from('photos').delete().eq('profile_id', profileId);
  const { error: photoErr } = await supabase.from('photos').insert([
    {
      profile_id: profileId,
      url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
      caption: 'Live on stage at Taj Lake Palace, Udaipur',
      sort_order: 1
    },
    {
      profile_id: profileId,
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      caption: 'Royal Varmala ceremony hosting',
      sort_order: 2
    },
    {
      profile_id: profileId,
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      caption: 'Crowd cheer during Sangeet dance face-off',
      sort_order: 3
    },
    {
      profile_id: profileId,
      url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
      caption: 'Corporate Keynote Emcee at Jio World Convention Centre',
      sort_order: 4
    },
    {
      profile_id: profileId,
      url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
      caption: 'Gala Dinner & Annual Excellence Awards Emcee',
      sort_order: 5
    },
    {
      profile_id: profileId,
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      caption: 'Pre-wedding cocktail & after-party vibes',
      sort_order: 6
    }
  ]);
  if (photoErr) console.error('Error inserting photos:', photoErr);
  else console.log('Photos inserted!');

  // 4. Clear and Insert Service Packages
  await supabase.from('service_packages').delete().eq('profile_id', profileId);
  const { error: pkgErr } = await supabase.from('service_packages').insert([
    {
      profile_id: profileId,
      name: 'The Sangeet & After-Party Experience',
      description: '4 hours of non-stop energy, personalized couple roasts, dance troupe cues, interactive family games, and seamless DJ handoff.',
      event_type: 'Sangeet',
      price_range_min: 55000,
      price_range_max: 75000,
      is_active: true,
      sort_order: 1
    },
    {
      profile_id: profileId,
      name: 'Royal Destination Wedding (Full 2 Days)',
      description: 'Complete coverage for Mehendi, Sangeet Night, Royal Varmala, and Grand Reception. Includes pre-wedding scripting & coordination.',
      event_type: 'Wedding',
      price_range_min: 125000,
      price_range_max: 180000,
      is_active: true,
      sort_order: 2
    },
    {
      profile_id: profileId,
      name: 'Corporate Summit & Annual Gala Emcee',
      description: 'Executive stage presence, CXO panel moderation, formal awards presentation, and bilingual protocol management.',
      event_type: 'Corporate Gala',
      price_range_min: 50000,
      price_range_max: 70000,
      is_active: true,
      sort_order: 3
    }
  ]);
  if (pkgErr) console.error('Error inserting packages:', pkgErr);
  else console.log('Packages inserted!');

  // 5. Clear and Insert Testimonials
  await supabase.from('testimonials').delete().eq('profile_id', profileId);
  const { error: revErr } = await supabase.from('testimonials').insert([
    {
      profile_id: profileId,
      client_name: 'Pooja & Rohan Singhal',
      client_designation: 'Couple — Destination Wedding at Taj Lake Palace, Udaipur',
      text: 'Aman turned our Udaipur wedding into an absolute concert! The energy during the Sangeet had our grandparents and cousins all dancing till 3 AM. Not a single dull moment!',
      rating: 5,
      event_type: 'Sangeet & Wedding',
      event_date: '2024-11-18',
      is_visible: true,
      sort_order: 1
    },
    {
      profile_id: profileId,
      client_name: 'Vikramaditya Malhotra',
      client_designation: 'VP Corporate Marketing, FinTech India',
      text: 'Phenomenal stage presence and time management. Hosted our annual APAC leadership summit for 1,200 delegates with effortless poise and bilingual wit.',
      rating: 5,
      event_type: 'Corporate Gala',
      event_date: '2024-12-05',
      is_visible: true,
      sort_order: 2
    },
    {
      profile_id: profileId,
      client_name: 'Dr. Sneha & Kunal Mehta',
      client_designation: 'Grand Reception at St. Regis, Mumbai',
      text: 'Best anchor we could have booked! Spontaneous, extremely respectful of family traditions yet modern and humorous. Guests are still asking for his contact!',
      rating: 5,
      event_type: 'Reception',
      event_date: '2025-01-12',
      is_visible: true,
      sort_order: 3
    }
  ]);
  if (revErr) console.error('Error inserting testimonials:', revErr);
  else console.log('Testimonials inserted!');

  // 6. Add some bookings to schedule to make calendar look alive!
  await supabase.from('bookings').delete().eq('profile_id', profileId);
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15).toISOString().split('T')[0];
  const nextMonth2 = new Date(today.getFullYear(), today.getMonth() + 1, 16).toISOString().split('T')[0];
  const nextMonth3 = new Date(today.getFullYear(), today.getMonth() + 1, 24).toISOString().split('T')[0];

  await supabase.from('bookings').insert([
    {
      profile_id: profileId,
      date: nextMonth,
      slot_type: 'evening',
      event_type: 'Sangeet',
      event_name: 'Singhal Grand Sangeet',
      city: 'Udaipur'
    },
    {
      profile_id: profileId,
      date: nextMonth2,
      slot_type: 'evening',
      event_type: 'Wedding',
      event_name: 'Singhal Royal Wedding',
      city: 'Udaipur'
    },
    {
      profile_id: profileId,
      date: nextMonth3,
      slot_type: 'full_day',
      event_type: 'Corporate Gala',
      event_name: 'Annual Tech Leadership Gala',
      city: 'Mumbai'
    }
  ]);
  console.log('Bookings inserted for calendar demo!');
  console.log('ALL DEMO DATA SEEDED SUCCESSFULLY!');
}

seed().catch(console.error);
