/* ============================================
   BookMyArtist — Global Site Themes
   Curated Modern & Royal themes for the entire platform
   (Supports both Regal Dark & Luminous Light Modes)
   ============================================ */

export interface GlobalSiteTheme {
  id: string;
  name: string;
  badge: string;
  category: 'royal' | 'modern' | 'luxury';
  mode: 'dark' | 'light';
  description: string;
  primary: string;
  primaryHover: string;
  accent: string;
  bg: string;
  cardBg: string;
  border: string;
  glow: string;
  previewGradient: string;
  previewColors: string[];
  features: string[];
}

export const GLOBAL_SITE_THEMES: GlobalSiteTheme[] = [
  // ── OFFICIAL LOGO-INSPIRED BRAND THEMES (MATCHING THE 3D GLOSSY 'b' & MIC) ──
  {
    id: 'bma-signature-aura',
    name: 'BookMyArtist Signature (Full Logo Aura)',
    badge: '✨ Official Flagship',
    category: 'modern',
    mode: 'dark',
    description: 'The definitive BookMyArtist flagship theme. Harmonizes all 3 core logo colors — Royal Indigo primary buttons, Electric Magenta ("My") secondary accents, and Sunset Amber highlights on midnight obsidian.',
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    accent: '#FF007A',
    bg: '#070814',
    cardBg: '#0F1226',
    border: 'rgba(99, 102, 241, 0.22)',
    glow: 'rgba(99, 102, 241, 0.45)',
    previewGradient: 'linear-gradient(135deg, #FF7A00 0%, #FF007A 50%, #6366F1 100%)',
    previewColors: ['#FF7A00', '#FF007A', '#6366F1', '#070814'],
    features: ['Triple Brand Gradient (Amber -> Magenta -> Indigo)', 'Royal Indigo Primary CTAs (White Text)', 'Electric Magenta "My" Accent Pills', 'Midnight Obsidian Stage Canvas'],
  },
  {
    id: 'bma-electric-stage',
    name: 'BookMyArtist Electric Stage (Live Concert)',
    badge: '🎤 Live Concert & DJ',
    category: 'modern',
    mode: 'dark',
    description: 'High-voltage live performance energy inspired by the logo\'s vibrant metallic mic and "My". Bold Electric Magenta buttons with warm Sunset Amber accents on deep velvet blackberry.',
    primary: '#FF007A',
    primaryHover: '#E0006C',
    accent: '#FF7A00',
    bg: '#08060E',
    cardBg: '#140E20',
    border: 'rgba(255, 0, 122, 0.24)',
    glow: 'rgba(255, 0, 122, 0.48)',
    previewGradient: 'linear-gradient(135deg, #FF007A 0%, #E0006C 45%, #FF7A00 90%)',
    previewColors: ['#FF007A', '#FF7A00', '#140E20', '#08060E'],
    features: ['High-Voltage Electric Magenta Primary Buttons', 'Warm Sunset Amber Secondary CTAs', 'Deep Blackberry Stage Glow', 'Tailored for Singers, Bands & DJ Concerts'],
  },
  {
    id: 'bma-royal-sapphire',
    name: 'BookMyArtist Royal Sapphire (Prestige Gala)',
    badge: '👑 Prestige Blue & Violet',
    category: 'royal',
    mode: 'dark',
    description: 'Prestige gala, corporate summit, and luxury wedding aesthetic inspired by the royal cobalt arc of the logo. Deep Electric Sapphire Blue buttons with Royal Violet and Magenta accents.',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    accent: '#7C3AED',
    bg: '#060813',
    cardBg: '#0D1426',
    border: 'rgba(37, 99, 235, 0.22)',
    glow: 'rgba(37, 99, 235, 0.45)',
    previewGradient: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 40%, #7C3AED 80%, #FF007A 100%)',
    previewColors: ['#2563EB', '#7C3AED', '#FF007A', '#060813'],
    features: ['Electric Cobalt Sapphire Primary Buttons', 'Royal Violet Secondary Buttons', 'Sunset Amber & Pink Micro-Highlights', 'High-Trust Corporate & Luxury Gala Vibe'],
  },


  // ── DARK MODE REGAL & MODERN THEMES ──
  {
    id: 'obsidian-violet',
    name: 'Obsidian Violet',
    badge: 'Modern Neon',
    category: 'modern',
    mode: 'dark',
    description: 'Electric Indigo & warm Amber on midnight obsidian. Tech-forward, high-contrast, modern stage aesthetic.',
    primary: '#6C5CE7',
    primaryHover: '#7E6FF0',
    accent: '#F0A500',
    bg: '#0A0A14',
    cardBg: '#16162A',
    border: 'rgba(255, 255, 255, 0.08)',
    glow: 'rgba(108, 92, 231, 0.4)',
    previewGradient: 'linear-gradient(135deg, #0A0A14 0%, #1A1A2E 50%, #12121F 100%)',
    previewColors: ['#6C5CE7', '#F0A500', '#16162A', '#0A0A14'],
    features: ['Vibrant Neon Indigo', 'Amber Accents', 'Deep Space Glassmorphism', 'Default BookMyArtist Vibe'],
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Royal Gold',
    badge: '👑 Royal Sovereign',
    category: 'royal',
    mode: 'dark',
    description: 'Lustrous Imperial Gold & warm Champagne on velvet midnight black. High-end luxury gala and wedding feel.',
    primary: '#D4AF37',
    primaryHover: '#E5C158',
    accent: '#FFF0B8',
    bg: '#07070B',
    cardBg: '#111019',
    border: 'rgba(212, 175, 55, 0.16)',
    glow: 'rgba(212, 175, 55, 0.5)',
    previewGradient: 'linear-gradient(135deg, #07070B 0%, #15131C 50%, #0D0D14 100%)',
    previewColors: ['#D4AF37', '#FFF0B8', '#111019', '#07070B'],
    features: ['Imperial Gold Buttons', 'Champagne Glow', 'Prestige Border Tints', 'Elite Wedding & Gala Look'],
  },
  {
    id: 'royal-emerald',
    name: 'Royal Emerald & Gold',
    badge: '💎 Crown Jewel',
    category: 'royal',
    mode: 'dark',
    description: 'Deep opulent emerald-velvet night with luminous mint-emerald jewels and royal warm gold accents.',
    primary: '#059669',
    primaryHover: '#10B981',
    accent: '#F59E0B',
    bg: '#030D08',
    cardBg: '#0B1E14',
    border: 'rgba(16, 185, 129, 0.16)',
    glow: 'rgba(16, 185, 129, 0.45)',
    previewGradient: 'linear-gradient(135deg, #030D08 0%, #0B2618 50%, #08170F 100%)',
    previewColors: ['#10B981', '#F59E0B', '#0B1E14', '#030D08'],
    features: ['Emerald Luster', 'Amber Gold Accents', 'Velvet Deep Greens', 'Wealth & Grandeur Aesthetic'],
  },
  {
    id: 'imperial-sapphire',
    name: 'Imperial Sapphire & Platinum',
    badge: '🌌 Neelam Royale',
    category: 'royal',
    mode: 'dark',
    description: 'Majestic midnight navy with electric royal sapphire blue, luminous star cyan, and platinum brilliance.',
    primary: '#2563EB',
    primaryHover: '#3B82F6',
    accent: '#06B6D4',
    bg: '#050914',
    cardBg: '#0D162E',
    border: 'rgba(56, 189, 248, 0.16)',
    glow: 'rgba(59, 130, 246, 0.48)',
    previewGradient: 'linear-gradient(135deg, #050914 0%, #0F1D3D 50%, #0A1124 100%)',
    previewColors: ['#2563EB', '#06B6D4', '#0D162E', '#050914'],
    features: ['Sapphire Blue Glow', 'Cyan Star Accents', 'Midnight Navy Atmosphere', 'Prestigious Tech-Gala Feel'],
  },
  {
    id: 'crimson-velvet',
    name: 'Crimson Velvet & Rose Gold',
    badge: '🌹 Red Carpet',
    category: 'luxury',
    mode: 'dark',
    description: 'Bollywood & Hollywood Red Carpet glamour — Deep Velvet Garnet, Radiant Ruby Rose, and Warm Champagne.',
    primary: '#E11D48',
    primaryHover: '#F43F5E',
    accent: '#FB7185',
    bg: '#0C0407',
    cardBg: '#180A10',
    border: 'rgba(244, 63, 94, 0.16)',
    glow: 'rgba(244, 63, 94, 0.48)',
    previewGradient: 'linear-gradient(135deg, #0C0407 0%, #200A13 50%, #14080D 100%)',
    previewColors: ['#E11D48', '#FB7185', '#180A10', '#0C0407'],
    features: ['Ruby Velvet Glow', 'Rose Gold Accents', 'Dramatic Stage Presence', 'Film Awards & Celebrity Feel'],
  },

  // ── LIGHT MODE REGAL & MODERN THEMES ──
  {
    id: 'ivory-gold',
    name: 'Ivory Royal Gold',
    badge: '☀️ Royal Ivory',
    category: 'royal',
    mode: 'light',
    description: 'Pristine pearl ivory silk with lustrous antique gold & amber champagne glow. Ideal for grand Indian wedding hosts & luxury celebrations.',
    primary: '#B8860B',
    primaryHover: '#996F08',
    accent: '#D4AF37',
    bg: '#FAF8F5',
    cardBg: '#FFFFFF',
    border: 'rgba(184, 134, 11, 0.18)',
    glow: 'rgba(184, 134, 11, 0.28)',
    previewGradient: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 50%, #ECE4D8 100%)',
    previewColors: ['#B8860B', '#D4AF37', '#FFFFFF', '#FAF8F5'],
    features: ['Pearl Ivory Silk Canvas', 'Imperial Gold Accents', 'Grand Wedding & Gala Look', '100% Light Mode Optimised'],
  },
  {
    id: 'crystal-sapphire',
    name: 'Crystal Sapphire & Platinum',
    badge: '☀️ Crystal Luxe',
    category: 'modern',
    mode: 'light',
    description: 'Ultra-clean pure white & slate mist with electric royal cobalt sapphire and vivid cyan highlights. Crisp corporate summit & keynote aesthetic.',
    primary: '#1D4ED8',
    primaryHover: '#1E40AF',
    accent: '#0284C7',
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    border: 'rgba(15, 23, 42, 0.1)',
    glow: 'rgba(29, 78, 216, 0.25)',
    previewGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 50%, #E2E8F0 100%)',
    previewColors: ['#1D4ED8', '#0284C7', '#FFFFFF', '#F8FAFC'],
    features: ['Crisp Slate & Pure White', 'Royal Cobalt Sapphire', 'Corporate Summit Clarity', '100% Light Mode Optimised'],
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz & Champagne',
    badge: '☀️ Rose Quartz',
    category: 'luxury',
    mode: 'light',
    description: 'Chic Parisian blush & rose milk with deep velvet ruby and warm champagne gold. Glamorous, high-fashion lifestyle and award night look.',
    primary: '#BE185D',
    primaryHover: '#9D174D',
    accent: '#D97706',
    bg: '#FFF9FA',
    cardBg: '#FFFFFF',
    border: 'rgba(190, 24, 93, 0.14)',
    glow: 'rgba(190, 24, 93, 0.25)',
    previewGradient: 'linear-gradient(135deg, #FFF9FA 0%, #FDF2F4 50%, #FCE7EC 100%)',
    previewColors: ['#BE185D', '#D97706', '#FFFFFF', '#FFF9FA'],
    features: ['Pastel Rose Silk Canvas', 'Velvet Ruby & Champagne', 'Fashion & Lifestyle Galas', '100% Light Mode Optimised'],
  },
];

export const DEFAULT_SITE_THEME = 'bma-signature-aura';
