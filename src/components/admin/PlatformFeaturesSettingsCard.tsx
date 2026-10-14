'use client';

import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  FileText,
  Star,
  MapPin,
  Gift,
  Calendar,
  Globe,
  WifiOff,
  Save,
  Loader2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { savePlatformSettings } from '@/lib/actions/admin';
import styles from './PlatformFeaturesSettingsCard.module.css';

export interface PlatformFeatureModule {
  key: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  accentColor: string;
  defaultState: boolean;
}

export const PLATFORM_MODULES_LIST: PlatformFeatureModule[] = [
  {
    key: 'feature_phone_verification',
    title: '1-Click Phone Anti-Spam Verification (OTP)',
    category: 'Security & Leads',
    description: 'Requires 4-digit mobile verification PIN on public booking inquiry forms to block spam and fake numbers.',
    icon: ShieldCheck,
    accentColor: '#3B82F6',
    defaultState: true,
  },
  {
    key: 'feature_digital_agreements',
    title: 'Digital Performance Agreement (E-Sign)',
    category: 'Contracts & Legal',
    description: 'Enables mobile finger signature contracts (/agreement/[id]) with 7-clause legal protection & zero escrow liability.',
    icon: FileText,
    accentColor: '#10B981',
    defaultState: true,
  },
  {
    key: 'feature_tech_riders',
    title: 'Stage Soundcheck & Tech Rider Studio',
    category: 'Audio Production',
    description: 'Enables technical sound gear checklist generator in artist Schedule with 1-tap WhatsApp sound engineer dispatch.',
    icon: Sliders,
    accentColor: '#F59E0B',
    defaultState: true,
  },
  {
    key: 'feature_client_reviews',
    title: 'Post-Event Client Review Collector',
    category: 'Social Proof',
    description: 'Enables the /review/[slug] direct rating loop for event organizers & wedding couples to submit verified testimonials.',
    icon: Star,
    accentColor: '#EC4899',
    defaultState: true,
  },
  {
    key: 'feature_city_seo_pages',
    title: 'City & Category Dynamic SEO Landing Pages',
    category: 'Organic Leads',
    description: 'Enables SSR landing pages (/artists/[city] & /artists/[city]/[category]) with JSON-LD schema for Google Search indexing.',
    icon: MapPin,
    accentColor: '#8B5CF6',
    defaultState: true,
  },
  {
    key: 'feature_referral_program',
    title: 'Artist Referral & Rewards Engine',
    category: 'Growth & Viral',
    description: 'Enables /referrals invite links, community leaderboard, and automated subscription validity extensions.',
    icon: Gift,
    accentColor: '#06B6D4',
    defaultState: true,
  },
  {
    key: 'feature_directory_availability',
    title: 'Live Date & Availability Calendar Filter',
    category: 'Discovery',
    description: 'Enables real-time calendar date availability picker and status checker in the public directory.',
    icon: Calendar,
    accentColor: '#6366F1',
    defaultState: true,
  },
  {
    key: 'feature_quotation_generator',
    title: 'Automated PDF Quotation & Rate Card Studio',
    category: 'Commercials',
    description: 'Enables 1-click corporate quotation generator in CRM with itemized commercials & PDF download.',
    icon: Sparkles,
    accentColor: '#F97316',
    defaultState: true,
  },
  {
    key: 'feature_custom_domains',
    title: 'Custom Domains White-Labeling (yourname.com)',
    category: 'Branding',
    description: 'Enables custom domain CNAME DNS mapping and automated SSL routing for Pro/Premium artists.',
    icon: Globe,
    accentColor: '#14B8A6',
    defaultState: true,
  },
  {
    key: 'feature_offline_pwa',
    title: 'Offline PWA Banquet Hall Mode',
    category: 'PWA & Offline',
    description: 'Enables service worker asset and portfolio caching for weak hotel basement signals.',
    icon: WifiOff,
    accentColor: '#A855F7',
    defaultState: true,
  },
];

interface PlatformFeaturesSettingsCardProps {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
}

export function PlatformFeaturesSettingsCard({ settings, onSettingChange }: PlatformFeaturesSettingsCardProps) {
  const { success, error: showError } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const getFeatureEnabled = (key: string, defaultVal: boolean): boolean => {
    if (settings[key] === undefined || settings[key] === null || settings[key] === '') {
      return defaultVal;
    }
    return settings[key] === 'true' || settings[key] === '1';
  };

  const handleToggle = (key: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    onSettingChange(key, nextVal ? 'true' : 'false');
  };

  const handleQuickSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, string> = {};
      PLATFORM_MODULES_LIST.forEach((m) => {
        payload[m.key] = getFeatureEnabled(m.key, m.defaultState) ? 'true' : 'false';
      });

      await savePlatformSettings(payload);
      success('Platform feature switches saved & synced across BookMyArtist in real-time!');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save feature switches');
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount = PLATFORM_MODULES_LIST.filter((m) => getFeatureEnabled(m.key, m.defaultState)).length;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3>
            <Layers size={22} style={{ color: 'var(--color-primary)' }} />
            Platform Modules &amp; Master Feature Switches
          </h3>
          <p className={styles.subtitle}>
            Globally enable or disable modules across BookMyArtist in real-time. Features toggled OFF are hidden across user profiles, navigation, and CRM.
          </p>
        </div>

        <div className={styles.statsRow}>
          <div
            className={styles.statBadge}
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <CheckCircle2 size={14} />
            <span>{activeCount} of {PLATFORM_MODULES_LIST.length} Modules Active</span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleQuickSave}
            disabled={isSaving}
            style={{ gap: '6px' }}
          >
            {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            <span>Save Feature Switches</span>
          </button>
        </div>
      </div>

      {/* Feature Modules Grid */}
      <div className={styles.featuresGrid}>
        {PLATFORM_MODULES_LIST.map((module) => {
          const isEnabled = getFeatureEnabled(module.key, module.defaultState);
          const IconComponent = module.icon;

          return (
            <div
              key={module.key}
              className={`${styles.featureCard} ${isEnabled ? styles.featureCardActive : ''}`}
            >
              <div className={styles.featureTop}>
                <div
                  className={styles.iconWrap}
                  style={{
                    background: `${module.accentColor}18`,
                    border: `1px solid ${module.accentColor}35`,
                    color: module.accentColor,
                  }}
                >
                  <IconComponent size={20} />
                </div>

                <div className={styles.featureInfo}>
                  <div className={styles.featureTitleRow}>
                    <h4 className={styles.featureTitle}>{module.title}</h4>
                    <span
                      className={styles.categoryTag}
                      style={{
                        background: `${module.accentColor}20`,
                        color: module.accentColor,
                        border: `1px solid ${module.accentColor}40`,
                      }}
                    >
                      {module.category}
                    </span>
                  </div>
                  <p className={styles.featureDesc}>{module.description}</p>
                </div>
              </div>

              <div className={styles.featureBottom}>
                <div className={styles.statusIndicator}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isEnabled ? '#10B981' : '#6B7280',
                      boxShadow: isEnabled ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
                    }}
                  />
                  <span style={{ color: isEnabled ? '#10B981' : 'rgba(255, 255, 255, 0.4)' }}>
                    {isEnabled ? 'Live on Platform' : 'Disabled'}
                  </span>
                </div>

                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggle(module.key, isEnabled)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
