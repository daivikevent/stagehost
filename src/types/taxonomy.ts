import { ArtistCategory, ARTIST_CATEGORIES } from '@/constants/artists';
import { EVENT_TYPES, LANGUAGES, MAJOR_CITIES, BUDGET_RANGES } from '@/constants';

export const DEFAULT_SPECIALTIES: string[] = [
  'Bilingual / Multilingual Emcee',
  'High-Energy Crowd Work & Roasts',
  'Royal Wedding Protocol & Sangeet Direction',
  'Fortune 500 Corporate Diplomacy',
  'Standup Comedy & Quick Wit',
  'Live Auctioneering',
  'Bollywood Commercial & EDM Mixes',
  'Acoustic Unplugged & Sufi Ghazals',
  'Mentalism & Interactive Illusions',
  'Keynote Moderation & CXO Panels',
];

export const DEFAULT_CLIENT_BRANDS: string[] = [
  'Taj Hotels & Palaces',
  'Forbes India Gala',
  'BMW Excellence Club',
  'Marriott Bonvoy',
  'Filmfare Red Carpet',
  'The Oberoi Group',
  'Rolls-Royce',
  'TEDx Conferences',
  'Vogue Weddings',
  'Cartier Privé',
  'ICICI Bank',
  'Tata Motors',
];

export interface PlatformTaxonomy {
  categories: ArtistCategory[];
  eventTypes: string[];
  languages: string[];
  cities: string[];
  specialties: string[];
  clientBrands: string[];
  budgetRanges: string[];
}

export const CANONICAL_TAXONOMY_DEFAULTS: PlatformTaxonomy = {
  categories: [...ARTIST_CATEGORIES],
  eventTypes: [...EVENT_TYPES],
  languages: [...LANGUAGES],
  cities: [...MAJOR_CITIES],
  specialties: [...DEFAULT_SPECIALTIES],
  clientBrands: [...DEFAULT_CLIENT_BRANDS],
  budgetRanges: [...BUDGET_RANGES],
};
