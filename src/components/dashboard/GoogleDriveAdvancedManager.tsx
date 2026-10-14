'use client';

import { useState } from 'react';
import {
  HardDrive,
  Video,
  Music,
  Camera,
  Archive,
  Save,
  Loader2,
  Check,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { GoogleDriveInputRow } from './GoogleDriveInputRow';
import { saveGoogleDriveStorageSettings } from '@/lib/actions/drive';
import { useToast } from '@/hooks/useToast';
import type { GoogleDriveFolderConfig, GoogleDriveStorageSettings } from '@/types';
import styles from './GoogleDriveStorage.module.css';

interface GoogleDriveAdvancedManagerProps {
  initialStorage?: GoogleDriveStorageSettings;
}

export function GoogleDriveAdvancedManager({ initialStorage }: GoogleDriveAdvancedManagerProps) {
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

    // Auto save on change
    setIsSaving(true);
    try {
      const res = await saveGoogleDriveStorageSettings(updated);
      if (res.success) {
        success('Storage configuration saved!');
      } else {
        showError(res.error || 'Failed to update storage settings');
      }
    } catch (err: any) {
      showError(err?.message || 'Error updating storage');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveGoogleDriveStorageSettings(storage);
      if (res.success) {
        success('All Google Drive storage settings saved successfully!');
      } else {
        showError(res.error || 'Failed to save storage settings');
      }
    } catch (err: any) {
      showError(err?.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Count verified folders
  const verifiedCount = [
    storage.primary_videos?.is_verified,
    storage.audio_demos?.is_verified,
    storage.photos?.is_verified,
    storage.backup?.is_verified,
  ].filter(Boolean).length;

  return (
    <div className={styles.studioCard}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h3>
            <HardDrive size={22} color="#10b981" />
            <span>Google Drive Multi-Folder Studio (Advanced)</span>
          </h3>
          <p>
            Map separate Google Drive folders for each category. Uncut stage videos, lossless audio
            tracks, and event photo albums will stream directly on your portfolio without taking up
            server storage quota.
          </p>
        </div>

        <div>
          <span className={verifiedCount > 0 ? styles.badge : `${styles.badge} ${styles.badgeNeutral}`}>
            <Check size={12} />
            {verifiedCount} of 4 Folders Connected
          </span>
        </div>
      </div>

      {/* Row 1: Primary Videos */}
      <GoogleDriveInputRow
        label="Primary Video Folder (Event & Stage Shows)"
        sublabel="Enter Google Drive folder URL for raw uncut stage performance clips (.mp4, .mov)"
        icon={Video}
        categoryKey="primary_videos"
        config={storage.primary_videos}
        onUpdate={handleUpdate}
      />

      {/* Row 2: Audio Demos */}
      <GoogleDriveInputRow
        label="Audio Samples & Vocals Folder (Lossless Tracks)"
        sublabel="Enter Google Drive folder URL for original tracks, live audio & vocal stems (.mp3, .wav)"
        icon={Music}
        categoryKey="audio_demos"
        config={storage.audio_demos}
        onUpdate={handleUpdate}
      />

      {/* Row 3: Event Photos */}
      <GoogleDriveInputRow
        label="High-Res Event Photos Folder (Albums & Portfolios)"
        sublabel="Enter Google Drive folder URL for high-resolution stage photos and photo shoots"
        icon={Camera}
        categoryKey="photos"
        config={storage.photos}
        onUpdate={handleUpdate}
      />

      {/* Row 4: Backup Storage */}
      <GoogleDriveInputRow
        label="Backup Photo & Video Storage (From My Account)"
        sublabel="Fallback backup folder if primary storage links are unavailable or archived"
        icon={Archive}
        categoryKey="backup"
        config={storage.backup}
        onUpdate={handleUpdate}
      />

      {/* Footer Manual Save Bar */}
      <div className={styles.footerActions}>
        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
          {isSaving ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa' }}>
              <Loader2 size={14} className="animate-spin" /> Saving changes to database...
            </span>
          ) : (
            <span>Auto-saved on verification. You can also manually sync anytime.</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleManualSave}
          disabled={isSaving}
          className={styles.verifyBtn}
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Storage Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Help Guide Accordion */}
      <div className={styles.helpGuide}>
        <div className={styles.helpGuideTitle}>
          <HelpCircle size={16} color="#60a5fa" />
          <span>How to get shareable folder links from your Google Drive:</span>
        </div>
        <ol className={styles.helpList}>
          <li>
            Open <strong>Google Drive</strong> (drive.google.com) on your computer or phone.
          </li>
          <li>
            Create a folder (e.g. <em>&quot;My Stage Videos&quot;</em>) and upload your performance files.
          </li>
          <li>
            Right-click the folder ➔ select <strong>Share</strong> ➔ under <em>General Access</em>, change from
            &quot;Restricted&quot; to <strong>&quot;Anyone with the link can view&quot;</strong>.
          </li>
          <li>
            Click <strong>Copy Link</strong>, paste it into the field above, and click <strong>Verify</strong>.
          </li>
        </ol>
      </div>
    </div>
  );
}
