'use client';

import { useState } from 'react';
import { Check, Loader2, ExternalLink, Trash2, AlertCircle, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { verifyGoogleDriveFolder } from '@/lib/actions/drive';
import { useToast } from '@/hooks/useToast';
import type { GoogleDriveFolderConfig, GoogleDriveStorageSettings } from '@/types';
import styles from './GoogleDriveStorage.module.css';

interface GoogleDriveInputRowProps {
  label: string;
  sublabel: string;
  icon: LucideIcon;
  categoryKey: keyof GoogleDriveStorageSettings;
  config?: GoogleDriveFolderConfig;
  onUpdate: (categoryKey: keyof GoogleDriveStorageSettings, newConfig?: GoogleDriveFolderConfig) => void;
  autoSave?: boolean;
}

export function GoogleDriveInputRow({
  label,
  sublabel,
  icon: Icon,
  categoryKey,
  config,
  onUpdate,
}: GoogleDriveInputRowProps) {
  const { success, error: showError } = useToast();
  const [url, setUrl] = useState(config?.url || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isVerified = Boolean(config?.is_verified && config.url === url);

  const handleVerify = async () => {
    if (!url.trim()) {
      setErrorMsg('Please enter a Google Drive folder link');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await verifyGoogleDriveFolder(url, label);

      if (res.success && res.folder_id) {
        const verifiedConfig: GoogleDriveFolderConfig = {
          url: res.url || url.trim(),
          folder_id: res.folder_id,
          folder_name: res.folder_name || label,
          is_verified: true,
          verified_at: new Date().toISOString(),
        };

        onUpdate(categoryKey, verifiedConfig);
        success(`Folder verified successfully! Connected to: ${verifiedConfig.folder_name}`);
      } else {
        setErrorMsg(res.error || 'Failed to verify folder. Please check sharing permissions.');
        showError(res.error || 'Verification failed');
      }
    } catch (err: any) {
      const msg = err?.message || 'Verification error. Please try again.';
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnect = () => {
    setUrl('');
    setErrorMsg(null);
    onUpdate(categoryKey, undefined);
    success(`Disconnected ${label}`);
  };

  return (
    <div className={`${styles.rowContainer} ${isVerified ? styles.rowContainerVerified : ''}`}>
      <div className={styles.rowHeader}>
        <div className={styles.rowLabel}>
          <Icon size={18} color="#8b5cf6" />
          <span>{label}</span>
        </div>
        {isVerified && (
          <span className={styles.badge}>
            <Check size={12} />
            Verified & Live
          </span>
        )}
      </div>

      <div className={styles.rowSublabel}>{sublabel}</div>

      <div className={styles.inputWrapper}>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="https://drive.google.com/drive/folders/1ZsoCT9d8b4r-ROiNzplFqobEhQ96Jxp9"
          className={`${styles.driveInput} ${isVerified ? styles.driveInputVerified : ''}`}
        />

        {isVerified ? (
          <div className={styles.verifiedBadgeIcon} title={`Verified: ${config?.folder_name}`}>
            <Check size={22} strokeWidth={2.8} />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || !url.trim()}
            className={styles.verifyBtn}
          >
            {isVerifying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify</span>
            )}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className={styles.errorBanner}>
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {isVerified && config && (
        <div className={styles.toastSuccessMini}>
          <div className={styles.toastText}>
            <Check size={15} color="#10b981" />
            <span>
              Folder verified successfully • Connected to:{' '}
              <span className={styles.folderTag}>{config.folder_name}</span>
            </span>
          </div>

          <div className={styles.actionLinks}>
            <a
              href={config.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkBtn}
            >
              <span>Open in Drive</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              onClick={handleDisconnect}
              className={styles.disconnectBtn}
            >
              <Trash2 size={12} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
