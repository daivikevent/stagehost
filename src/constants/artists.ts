/* ============================================
   StageHost — Universal Artist & Performer Taxonomy
   Multi-Artist Engine: Scalable taxonomy for Anchors,
   DJs, Singers, Musicians, Comedians, Dancers, etc.
   ============================================ */

export interface ArtistCategory {
  id: string;
  label: string;
  shortLabel: string;
  hindiName: string;
  emoji: string;
  badge: string;
  description: string;
  popularEventTypes: string[];
  specialties: string[];
  mediaTypes: ('video' | 'audio' | 'photo')[];
}

export const ARTIST_CATEGORIES: ArtistCategory[] = [
  {
    id: 'emcee',
    label: 'Anchor & Emcee',
    shortLabel: 'Emcee',
    hindiName: 'एंकर / एम्सी',
    emoji: '🎤',
    badge: 'Verified Emcee',
    description: 'Live stage hosts, wedding emcees, corporate presenters, and ceremony anchors.',
    popularEventTypes: ['Wedding', 'Sangeet', 'Corporate Event', 'Award Ceremony', 'Conference', 'Product Launch'],
    specialties: ['Crowd Engagement', 'Bilingual Hosting', 'Humor & Quick Wit', 'Protocol Management', 'Formal Galas'],
    mediaTypes: ['video', 'photo'],
  },
  {
    id: 'dj',
    label: 'DJ & Music Producer',
    shortLabel: 'DJ',
    hindiName: 'डीजे एवं म्यूजिक प्रोड्यूसर',
    emoji: '🎧',
    badge: 'Verified DJ',
    description: 'Club DJs, wedding celebration DJs, electronic artists, and Bollywood remixers.',
    popularEventTypes: ['Sangeet', 'Cocktail Party', 'College Festival', 'Concert', 'Private Party'],
    specialties: ['Bollywood Commercial', 'EDM / House', 'Punjabi Dhol Mixes', 'Tech Rider Setup', 'Visual Lighting Sync'],
    mediaTypes: ['audio', 'video', 'photo'],
  },
  {
    id: 'singer',
    label: 'Live Singer & Vocalist',
    shortLabel: 'Singer',
    hindiName: 'गायक / गायिका',
    emoji: '🎵',
    badge: 'Verified Vocalist',
    description: 'Solo vocalists, playback artists, acoustic singers, Sufi and classical performers.',
    popularEventTypes: ['Wedding', 'Sangeet', 'Concert', 'Live Show', 'Corporate Event', 'Private Party'],
    specialties: ['Acoustic Unplugged', 'Sufi & Ghazal', 'Retro Bollywood', 'English Pop', 'Classical Fusion'],
    mediaTypes: ['video', 'audio', 'photo'],
  },
  {
    id: 'musician',
    label: 'Live Band & Instrumentalist',
    shortLabel: 'Band / Musician',
    hindiName: 'लाइव बैंड एवं संगीतकार',
    emoji: '🎸',
    badge: 'Verified Musician',
    description: 'Full live music bands, violinists, saxophonists, flutists, and percussion ensembles.',
    popularEventTypes: ['Concert', 'Wedding', 'Corporate Event', 'Cocktail Party', 'College Festival'],
    specialties: ['Fusion Instrumental', 'Rock / Indie Band', 'Solo Saxophone', 'Brass Band', 'Percussion Jam'],
    mediaTypes: ['video', 'audio', 'photo'],
  },
  {
    id: 'standup',
    label: 'Stand-up Comedian',
    shortLabel: 'Comedian',
    hindiName: 'स्टैंड-अप कॉमेडियन',
    emoji: '🎭',
    badge: 'Verified Comedian',
    description: 'Humorists, observational comics, corporate comedy acts, and crowd roasters.',
    popularEventTypes: ['Corporate Event', 'College Festival', 'Concert', 'Private Party', 'Award Ceremony'],
    specialties: ['Clean Corporate Comedy', 'Hinglish Observational', 'Crowd Work', 'Custom Company Roasts'],
    mediaTypes: ['video', 'photo'],
  },
  {
    id: 'dancer',
    label: 'Dancer & Choreographer',
    shortLabel: 'Dancer',
    hindiName: 'डांसर / कोरियोग्राफर',
    emoji: '💃',
    badge: 'Verified Dancer',
    description: 'Stage dance troupes, solo contemporary performers, and wedding sangeet choreographers.',
    popularEventTypes: ['Sangeet', 'Wedding', 'Award Ceremony', 'College Festival', 'Corporate Event'],
    specialties: ['Bollywood Flashmobs', 'Aerial & Contemporary', 'Sangeet Family Choreography', 'Theme Dance Troupes'],
    mediaTypes: ['video', 'photo'],
  },
  {
    id: 'magician',
    label: 'Magician & Illusionist',
    shortLabel: 'Magician',
    hindiName: 'जादूगर / मेंटलिस्ट',
    emoji: '🎩',
    badge: 'Verified Illusionist',
    description: 'Mentalists, mind readers, close-up illusionists, and grand stage magicians.',
    popularEventTypes: ['Corporate Event', 'Birthday Party', 'Product Launch', 'College Festival', 'Private Party'],
    specialties: ['Mentalism & Mind Reading', 'Close-Up Table Magic', 'Grand Stage Illusions', 'Interactive Magic'],
    mediaTypes: ['video', 'photo'],
  },
  {
    id: 'speaker',
    label: 'Keynote Speaker & Moderator',
    shortLabel: 'Speaker',
    hindiName: 'वक्ता एवं मॉडरेटर',
    emoji: '📢',
    badge: 'Verified Speaker',
    description: 'Thought leaders, TEDx speakers, industry panellists, and panel discussion moderators.',
    popularEventTypes: ['Conference', 'Corporate Event', 'College Festival', 'Product Launch'],
    specialties: ['Leadership & Vision', 'Tech Innovations', 'Motivational Keynotes', 'Executive Panel Moderation'],
    mediaTypes: ['video', 'photo'],
  },
  {
    id: 'voiceover',
    label: 'Voice-Over & Mimicry Artist',
    shortLabel: 'Voice Artist',
    hindiName: 'वॉइस-ओवर एवं मिमिक्री',
    emoji: '🎙️',
    badge: 'Verified Voice Artist',
    description: 'Commercial VO artists, dubbing professionals, celebrity impressionists, and mimicry artists.',
    popularEventTypes: ['Corporate Event', 'Award Ceremony', 'College Festival', 'Live Show'],
    specialties: ['Celebrity Impressions', 'Multilingual Narration', 'Live Stage Dubbing', 'Commercial Scripts'],
    mediaTypes: ['audio', 'video', 'photo'],
  },
  {
    id: 'photographer',
    label: 'Event Photographer & Filmmaker',
    shortLabel: 'Photographer',
    hindiName: 'फोटोग्राफर एवं फिल्ममेकर',
    emoji: '📸',
    badge: 'Verified Photographer',
    description: 'Candid wedding photographers, concert cinematographers, and event visual directors.',
    popularEventTypes: ['Wedding', 'Reception', 'Concert', 'Fashion Show', 'Corporate Event'],
    specialties: ['Candid Portraits', 'Drone Cinematography', 'Same-Day Video Edits', 'Fashion Editorial'],
    mediaTypes: ['photo', 'video'],
  },
  {
    id: 'celebrity',
    label: 'Celebrity Guest & Influencer',
    shortLabel: 'Celebrity',
    hindiName: 'सेलिब्रिटी / इन्फ्लुएंसर',
    emoji: '⭐',
    badge: 'Verified Celebrity',
    description: 'Actors, digital creators, models, and public figures available for event appearances and ribbon-cuttings.',
    popularEventTypes: ['Product Launch', 'Award Ceremony', 'Fashion Show', 'Wedding', 'College Festival'],
    specialties: ['Chief Guest Appearances', 'Ribbon Cutting', 'Meet & Greets', 'Social Media Shoutouts'],
    mediaTypes: ['photo', 'video'],
  },
];

export const DEFAULT_ARTIST_CATEGORY_ID = 'emcee';

/**
 * Get artist category by ID with safe fallback to Anchor / Emcee
 */
export function getArtistCategory(id?: string | null): ArtistCategory {
  if (!id) return ARTIST_CATEGORIES[0];
  const found = ARTIST_CATEGORIES.find(
    (c) => c.id.toLowerCase() === id.toLowerCase() || c.shortLabel.toLowerCase() === id.toLowerCase()
  );
  return found || ARTIST_CATEGORIES[0];
}

/**
 * Get dynamic verification badge label for an artist
 */
export function getArtistBadgeLabel(categoryId?: string | null): string {
  const cat = getArtistCategory(categoryId);
  return cat.badge;
}

/**
 * Get singular artist title (e.g. 'Anchor', 'DJ', 'Singer')
 */
export function getArtistSingularTitle(categoryId?: string | null): string {
  const cat = getArtistCategory(categoryId);
  return cat.shortLabel;
}

/**
 * Get plural artist title (e.g. 'Anchors', 'DJs', 'Singers')
 */
export function getArtistPluralTitle(categoryId?: string | null): string {
  const cat = getArtistCategory(categoryId);
  if (cat.id === 'dj') return 'DJs';
  if (cat.id === 'singer') return 'Singers';
  if (cat.id === 'standup') return 'Comedians';
  if (cat.id === 'musician') return 'Musicians & Bands';
  if (cat.id === 'dancer') return 'Dancers';
  if (cat.id === 'magician') return 'Magicians';
  if (cat.id === 'speaker') return 'Keynote Speakers';
  return 'Anchors & Emcees';
}
