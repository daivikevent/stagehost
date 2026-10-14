'use client';

import { useState } from 'react';
import { HardDrive, Sparkles, Video, ArrowRight, Save, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { GoogleDriveInputRow } from './GoogleDriveInputRow';
import { saveGoogleDriveStorageSettings } from '@/lib/actions/drive';
import { useToast } from '@/hooks/useToast';
import type { GoogleDriveFolderConfig, GoogleDriveStorageSettings } from '@/types';
import styles from './GoogleDriveStorage.module.css';

interface GoogleDriveQuickCardProps {
  initialStorage?: GoogleDriveStorageSettings;
}

export function GoogleDriveQuickCard({ initialStorage }: GoogleDriveQuickCardProps) {
  const { success, error: showError } = useToast();
  const [storage, setStorage] = useState<GoogleDriveStorageSettings>(initialStorage || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async (
    categoryKey: keyof GoogleDriveStorageSettings,
    newConfig?: GoogleDriveFolderConfig
  ) => {
    const updated: GoogleDriveStorageSettings = {
      ...storage,
      [categoryKey]: newConfig,
    };
    setStorage(updated);

    // Auto-save on verification or disconnect
    setIsSaving(true);
    try {
      const res = await saveGoogleDriveStorageSettings(updated);
      if (res.success) {
        success('Google Drive storage settings saved!');
      } else {
        showError(res.error || 'Failed to save storage settings');
      }
    } catch (err: any) {
      showError(err?.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const isPrimaryConnected = Boolean(storage.primary_videos?.is_verified);

  return (
    <div className={styles.studioCard} style={{ margin: '1.5rem 0 2rem 0' }}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h3>
            <HardDrive size={22} color="#10b981" />
            <span>Connect Google Drive (Zero-Storage Bridge)</span>
          </h3>
          <p>
            Paste your Google Drive folder link once. Stream unlimited uncut 4K stage videos and
            lossless audio samples directly on your public portfolio with <strong>₹0 hosting fees</strong>.
          </p>
        </div>

        <div>
          {isPrimaryConnected ? (
            <span className={styles.badge}>
              <Check size={12} />
              Drive Connected
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeNeutral}`}>
              <Sparkles size={12} />
              Single Folder Quick Setup
            </span>
          )}
        </div>
      </div>

      <GoogleDriveInputRow
        label="Primary Media Folder (Stage Clips & Demos)"
        sublabel="Enter a Google Drive folder URL containing your performance videos or audio files"
        icon={Video}
        categoryKey="primary_videos"
        config={storage.primary_videos}
        onUpdate={handleUpdate}
      />

      <div className={styles.footerActions}>
        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
          {isSaving ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa' }}>
              <Loader2 size={13} className="animate-spin" /> Saving changes to database...
            </span>
          ) : isPrimaryConnected ? (
            <span style={{ color: '#34d399' }}>✓ All files inside this folder stream directly to your profile</span>
          ) : (
            <span>Make sure folder sharing is set to &quot;Anyone with the link can view&quot;</span>
          )}
        </div>

        <Link
          href="/settings?tab=storage"
          style={{
            fontSize: '0.84rem',
            color: '#a78bfa',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 600,
          }}
        >
          <span>Advanced: Category-wise Multi-Folder Setup (Audio, Photos & Backup)</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
