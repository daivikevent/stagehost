/* ============================================
   StageHost — Utility Functions
   ============================================ */

import type { BrandingPlacement, PlanTier } from '@/types';
import { BRANDING_REMOVAL_MAP } from '@/constants';

/**
 * Generate URL-friendly slug from a string
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if branding should be shown for a given placement and plan tier
 */
export function shouldShowBranding(
  planTier: PlanTier | null | undefined,
  placement: BrandingPlacement
): boolean {
  const removalTier = BRANDING_REMOVAL_MAP[placement];
  return !planTier || planTier < removalTier;
}

/**
 * Format price in INR
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

/**
 * Get initials from a name (for avatar fallback)
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Detect video platform from URL
 */
export function detectVideoPlatform(
  url: string
): 'youtube' | 'instagram' | 'facebook' | 'google_drive' | 'other' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('drive.google.com')) return 'google_drive';
  return 'other';
}

/**
 * Extract YouTube video ID from URL
 */
export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Get YouTube thumbnail URL
 */
/**
 * Extract YouTube thumbnail URL with reliable fallback
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Extract Google Drive file ID from URL
 */
export function getGoogleDriveId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/file\/u\/\d+\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Get Google Drive embed URL
 */
export function getGoogleDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Get embed player URL for any video (YouTube, Google Drive, Direct MP4, etc.)
 */
export function getVideoEmbedInfo(url: string): {
  platform: 'youtube' | 'google_drive' | 'instagram' | 'facebook' | 'direct' | 'other';
  embedUrl: string | null;
  thumbnailUrl: string | null;
} {
  const platform = detectVideoPlatform(url);

  if (platform === 'youtube') {
    const ytId = getYouTubeId(url);
    return {
      platform: 'youtube',
      embedUrl: ytId ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0` : null,
      thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null,
    };
  }

  if (platform === 'google_drive') {
    const driveId = getGoogleDriveId(url);
    return {
      platform: 'google_drive',
      embedUrl: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null,
      thumbnailUrl: driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w640` : null,
    };
  }

  if (platform === 'instagram') {
    const postId = getInstagramPostId(url);
    return {
      platform: 'instagram',
      embedUrl: postId ? `https://www.instagram.com/reel/${postId}/embed` : null,
      thumbnailUrl: null,
    };
  }

  if (url.match(/\.(mp4|webm|ogg)($|\?)/i)) {
    return {
      platform: 'direct',
      embedUrl: url,
      thumbnailUrl: null,
    };
  }

  return {
    platform: platform === 'other' ? 'other' : platform,
    embedUrl: null,
    thumbnailUrl: null,
  };
}

/**
 * Extract Instagram post ID from URL
 */
export function getInstagramPostId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Format event date string into clean display (e.g. 14 Feb 2026)
 */
export function formatEventDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0].slice(-4), 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Generate a WhatsApp link
 */
export function getWhatsAppLink(
  phone: string,
  message?: string
): string {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.replace(/^0+/, '');
  }
  const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${phoneWithCountry}${encodedMessage}`;
}

/**
 * Generate a phone tel link
 */
export function getPhoneLink(phone: string): string {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.replace(/^0+/, '');
  }
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    return `tel:+${cleanPhone}`;
  }
  if (cleanPhone.length === 10) {
    return `tel:+91${cleanPhone}`;
  }
  return `tel:+${cleanPhone}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate Indian phone number
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleanPhone);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a unique ID (client-side)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const today = new Date();
  const check = new Date(date);
  return (
    check.getDate() === today.getDate() &&
    check.getMonth() === today.getMonth() &&
    check.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date): boolean {
  return new Date(date) < new Date();
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the first day of the month (0 = Sunday, 6 = Saturday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Format a date to YYYY-MM-DD
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * cn — Merge class names (simple implementation, no clsx needed)
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Safely normalize social & website URLs to ensure they have valid https:// protocol
 */
export function normalizeExternalUrl(
  url?: string | null,
  platform?: 'instagram' | 'youtube' | 'facebook' | 'generic'
): string {
  if (!url) return '';
  let clean = url.trim();
  if (!clean) return '';

  if (platform === 'instagram') {
    clean = clean.replace(/^@/, '');
    if (!clean.includes('instagram.com')) {
      clean = `instagram.com/${clean}`;
    }
  } else if (platform === 'youtube') {
    if (!clean.includes('youtube.com') && !clean.includes('youtu.be')) {
      clean = clean.startsWith('@') ? `youtube.com/${clean}` : `youtube.com/@${clean}`;
    }
  } else if (platform === 'facebook') {
    if (!clean.includes('facebook.com') && !clean.includes('fb.com')) {
      clean = `facebook.com/${clean}`;
    }
  }

  if (!/^https?:\/\//i.test(clean)) {
    clean = `https://${clean}`;
  }

  return clean;
}

/**
 * Extract custom slot times from anchor profile object or tags
 */
export function extractSlotTimes(profile: any): { morning: string; evening: string; full_day: string } | null {
  if (profile?.slot_times && typeof profile.slot_times === 'object') {
    return profile.slot_times;
  }
  if (Array.isArray(profile?.artist_specialties)) {
    const timeTag = profile.artist_specialties.find((s: string) => typeof s === 'string' && s.startsWith('slot_times:'));
    if (timeTag) {
      try {
        const json = JSON.parse(timeTag.replace('slot_times:', ''));
        if (json && (json.morning || json.evening)) return json;
      } catch (e) {}
    }
  }
  return null;
}


