'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Film,
  Music,
  Upload,
  Link as LinkIcon,
  Check,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Calendar,
  AlertCircle,
  Play,
  FileVideo,
  FileAudio,
  HardDrive,
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  type RawMediaItem,
  type ArtistStorageUsage,
  getArtistStorageUsage,
  uploadRawMediaFile,
  addRawMediaItem,
  updateRawMediaItem,
  deleteRawMediaItem,
} from '@/lib/actions/raw-media';
import styles from './RawMediaVaultClient.module.css';

interface RawMediaVaultClientProps {
  initialItems: RawMediaItem[];
  initialStorageUsage?: ArtistStorageUsage;
  artistName: string;
  artistSlug: string;
}

export function RawMediaVaultClient({
  initialItems,
  initialStorageUsage,
  artistName,
  artistSlug,
}: RawMediaVaultClientProps) {
  const { success, error: showError } = useToast();

  const [items, setItems] = useState<RawMediaItem[]>(initialItems);
  const [storageUsage, setStorageUsage] = useState<ArtistStorageUsage | undefined>(initialStorageUsage);
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>(
    initialStorageUsage?.isLocked ? 'link' : 'upload'
  );
  const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'public' | 'private'>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');
  const [isPublic, setIsPublic] = useState(true);
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Upload progress / states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetForm = () => {
    setTitle('');
    setEventName('');
    setDescription('');
    setExternalUrl('');
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const audioExts = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];
    if (audioExts.includes(ext) || file.type.startsWith('audio/')) {
      setMediaType('audio');
    } else {
      setMediaType('video');
    }

    if (!title) {
      // Auto-set title from filename without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('Please enter a title for this clip or track');
      return;
    }

    if (activeTab === 'upload') {
      if (!selectedFile) {
        showError('Please select a video or audio file to upload');
        return;
      }

      setIsUploading(true);
      setUploadProgress(30);

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploadProgress(60);
        const uploadRes = await uploadRawMediaFile(formData);

        setUploadProgress(90);
        const newItem = await addRawMediaItem({
          title,
          media_type: uploadRes.mediaType,
          file_url: uploadRes.url,
          file_name: uploadRes.fileName,
          file_size: uploadRes.fileSize,
          event_name: eventName,
          description,
          is_public: isPublic,
          storage_provider: uploadRes.storageProvider,
        });

        setItems((prev) => [newItem, ...prev]);
        success('Work sample uploaded and saved to vault successfully!');
        resetForm();
        getArtistStorageUsage().then(setStorageUsage).catch(() => {});
      } catch (err: any) {
        showError(err.message || 'Failed to upload media file');
      } finally {
        setIsUploading(false);
      }
    } else {
      // External Link
      if (!externalUrl.trim()) {
        showError('Please provide a valid video or audio link');
        return;
      }

      startTransition(async () => {
        try {
          const newItem = await addRawMediaItem({
            title,
            media_type: mediaType,
            file_url: externalUrl.trim(),
            file_name: 'External Cloud Link',
            event_name: eventName,
            description,
            is_public: isPublic,
          });

          setItems((prev) => [newItem, ...prev]);
          success('Media link saved to your vault successfully!');
          resetForm();
        } catch (err: any) {
          showError(err.message || 'Failed to save media link');
        }
      });
    }
  };

  const handleTogglePublic = (id: string, currentPublic: boolean) => {
    const nextPublic = !currentPublic;
    startTransition(async () => {
      try {
        const updatedList = await updateRawMediaItem(id, { is_public: nextPublic });
        setItems(updatedList);
        success(
          nextPublic
            ? 'Clip is now visible on your public portfolio!'
            : 'Clip moved to private vault (shareable by direct link only).'
        );
      } catch (err) {
        showError('Failed to update clip visibility');
      }
    });
  };

  const handleDelete = (id: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to remove "${itemTitle}" from your vault?`)) return;

    startTransition(async () => {
      try {
        await deleteRawMediaItem(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        success('Work sample removed from vault.');
        getArtistStorageUsage().then(setStorageUsage).catch(() => {});
      } catch (err) {
        showError('Failed to delete media item');
      }
    });
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    success('Media URL copied to clipboard!');
  };

  const handleWhatsAppShare = (item: RawMediaItem) => {
    const msg = `Hello! Here is my raw unedited live performance sample: "${item.title}" ${
      item.event_name ? `(${item.event_name})` : ''
    }\n\n▶ Watch / Listen: ${item.file_url}\n\n— Shared from BookMyArtist profile: https://bookmyartist.in/${artistSlug}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filter === 'video') return item.media_type === 'video';
    if (filter === 'audio') return item.media_type === 'audio';
    if (filter === 'public') return item.is_public;
    if (filter === 'private') return !item.is_public;
    return true;
  });

  const videoCount = items.filter((i) => i.media_type === 'video').length;
  const audioCount = items.filter((i) => i.media_type === 'audio').length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <Film size={26} color="var(--color-primary)" />
            <span>Raw Stage Clips &amp; Audio Vault</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Upload unedited raw video footage (.mp4, .mov, .webm) and live vocal/music tracks (.mp3, .wav)
            of your authentic work for event planners and wedding coordinators.
          </p>
          <div className={styles.badgesRow}>
            <span className={styles.formatBadge}>MP4 Video</span>
            <span className={styles.formatBadge}>MOV / WebM</span>
            <span className={styles.formatBadge}>MP3 Audio</span>
            <span className={styles.formatBadge}>WAV / M4A</span>
            <span className={styles.formatBadge}>Google Drive Link</span>
          </div>
        </div>

        <a
          href={`/${artistSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Eye size={14} /> View Public Portfolio
        </a>
      </div>

      {/* Cloud Storage Quota Bar */}
      {storageUsage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: storageUsage.isLocked ? 'rgba(239, 68, 68, 0.08)' : 'rgba(6, 182, 212, 0.08)',
            border: `1px solid ${storageUsage.isLocked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(6, 182, 212, 0.25)'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            {storageUsage.isLocked ? (
              <>
                <Lock size={16} color="#f87171" />
                <span style={{ color: '#f87171' }}>Cloud Media Vault: 0 GB (Free Plan Locked)</span>
              </>
            ) : (
              <>
                <HardDrive size={16} color="#06b6d4" />
                <span style={{ color: '#06b6d4' }}>
                  Cloud Storage: {storageUsage.usedFormatted} / {storageUsage.totalGb} GB used ({storageUsage.percentUsed}%)
                </span>
              </>
            )}
          </div>

          {!storageUsage.isLocked && (
            <div
              style={{
                flex: '1 1 160px',
                height: '7px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                overflow: 'hidden',
                minWidth: '120px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(2, storageUsage.percentUsed))}%`,
                  background:
                    storageUsage.percentUsed > 90
                      ? '#ef4444'
                      : storageUsage.percentUsed > 70
                      ? '#f59e0b'
                      : '#06b6d4',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          )}

          {storageUsage.isLocked ? (
            <a
              href="/pricing"
              className="btn btn-primary btn-xs"
              style={{ marginLeft: 'auto', textDecoration: 'none' }}
            >
              Upgrade to Unlock
            </a>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              {storageUsage.planName} Plan Quota
            </span>
          )}
        </div>
      )}

      {/* Upload Studio Card */}
      <div className={styles.uploadCard}>
        <div className={styles.uploadTabs}>
          <button
            type="button"
            className={`${styles.uploadTabBtn} ${activeTab === 'upload' ? styles.uploadTabActive : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={15} /> Upload Direct File
          </button>
          <button
            type="button"
            className={`${styles.uploadTabBtn} ${activeTab === 'link' ? styles.uploadTabActive : ''}`}
            onClick={() => setActiveTab('link')}
          >
            <LinkIcon size={15} /> External Cloud Link (Drive / Dropbox)
          </button>
        </div>

        <form onSubmit={handleCreateMedia}>
          {activeTab === 'upload' ? (
            storageUsage?.isLocked ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  marginBottom: '16px',
                }}
              >
                <Lock size={34} color="#f87171" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#f87171', fontWeight: 600 }}>
                  Direct Cloud File Uploads are Locked on Free Plan
                </h4>
                <p style={{ margin: '0 auto 16px', maxWidth: '480px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Free plan artists can use the <strong>External Cloud Link</strong> tab to paste unlimited Google Drive, Dropbox, or YouTube links. To upload high-speed MP4 videos and MP3 audios directly to our Cloud Vault, please upgrade to a Paid Plan.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('link')}
                  >
                    Switch to External Link
                  </button>
                  <a href="/pricing" className="btn btn-primary btn-sm">
                    Upgrade to Unlock Cloud Storage
                  </a>
                </div>
              </div>
            ) : (
            <div>
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropzoneIcon}>
                  {selectedFile ? (
                    selectedFile.type.startsWith('audio/') ? (
                      <Music size={28} />
                    ) : (
                      <Film size={28} />
                    )
                  ) : (
                    <Upload size={28} />
                  )}
                </div>

                {selectedFile ? (
                  <div>
                    <p className={styles.dropzoneTitle}>{selectedFile.name}</p>
                    <p className={styles.dropzoneText}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · Ready to upload
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className={styles.dropzoneTitle}>Click or Drag Video / Audio File here</p>
                    <p className={styles.dropzoneText}>
                      Supports MP4, MOV, WebM raw videos &amp; MP3, WAV, M4A audios
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {isUploading && (
                <div style={{ marginTop: '14px' }}>
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${uploadProgress}%`,
                        background: 'var(--color-primary, #6366f1)',
                        transition: 'width 250ms ease',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: '4px',
                    }}
                  >
                    <span>Uploading raw file to secure media vault...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Direct Video / Audio URL or Google Drive Link</label>
              <input
                type="url"
                className={styles.input}
                placeholder="https://drive.google.com/file/d/... or direct .mp4 / .mp3 link"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                Tip: If using Google Drive, ensure link sharing is set to &quot;Anyone with the link can view&quot;.
              </span>
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Title / Work Description *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Sangeet Live Emcee Interaction (Raw)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Event / Occasion Name (Optional)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Destination Wedding in Udaipur"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Media Type</label>
              <select
                className={styles.input}
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'video' | 'audio')}
              >
                <option value="video">Raw Video (.mp4 / .mov)</option>
                <option value="audio">Raw Audio / Vocal (.mp3 / .wav)</option>
              </select>
            </div>
          </div>

          {/* Visibility Switch */}
          <div className={styles.switchContainer}>
            <div className={styles.switchInfo}>
              <div className={styles.switchTitle}>
                {isPublic ? '🌐 Show on Public Portfolio' : '🔒 Private Vault Only'}
              </div>
              <div className={styles.switchDesc}>
                {isPublic
                  ? 'Event clients visiting your portfolio can watch/listen directly under "Raw Work Samples".'
                  : 'Hidden from public portfolio. Only you can share via direct WhatsApp link upon client request.'}
              </div>
            </div>
            <button
              type="button"
              className={`btn btn-xs ${isPublic ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setIsPublic(!isPublic)}
            >
              {isPublic ? 'Public' : 'Private'}
            </button>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={resetForm}
              disabled={isUploading || isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isUploading || isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={14} />
              {isUploading ? 'Uploading...' : 'Save to Vault'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('all')}
        >
          All Items ({items.length})
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'video' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('video')}
        >
          <FileVideo size={13} /> Raw Videos ({videoCount})
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'audio' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('audio')}
        >
          <FileAudio size={13} /> Raw Audios ({audioCount})
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'public' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('public')}
        >
          <Eye size={13} /> Public ({items.filter((i) => i.is_public).length})
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'private' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('private')}
        >
          <EyeOff size={13} /> Private ({items.filter((i) => !i.is_public).length})
        </button>
      </div>

      {/* Media Items Grid */}
      {filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          <Film size={36} color="rgba(255,255,255,0.25)" />
          <h3 style={{ fontSize: '15px', color: '#fff', margin: 0 }}>No media clips found in this filter</h3>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', maxWidth: '400px', margin: 0 }}>
            Upload raw video footage or unedited MP3 audio clips above to build your private client sample vault.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((item) => (
            <div key={item.id} className={styles.mediaCard}>
              <div className={styles.mediaPreview}>
                {item.media_type === 'video' ? (
                  item.file_url.includes('drive.google.com') ? (
                    <iframe
                      src={
                        item.file_url.includes('/preview')
                          ? item.file_url
                          : item.file_url.replace(/\/view.*$/, '/preview')
                      }
                      title={item.title}
                      className={styles.videoElement}
                      allow="autoplay"
                    />
                  ) : (
                    <video
                      src={item.file_url}
                      controls
                      playsInline
                      preload="metadata"
                      className={styles.videoElement}
                    />
                  )
                ) : (
                  <div className={styles.audioContainer}>
                    <div className={styles.audioIconLarge}>
                      <Music size={24} />
                    </div>
                    <audio
                      src={item.file_url}
                      controls
                      preload="metadata"
                      className={styles.audioPlayer}
                    />
                  </div>
                )}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <h4 className={styles.cardTitle}>{item.title}</h4>
                  <span
                    className={`${styles.badgeType} ${
                      item.media_type === 'video' ? styles.badgeVideo : styles.badgeAudio
                    }`}
                  >
                    {item.media_type}
                  </span>
                </div>

                {item.event_name && (
                  <div className={styles.cardEvent}>
                    <Sparkles size={11} /> {item.event_name}
                  </div>
                )}

                <div className={styles.cardMeta}>
                  {item.file_size && <span>{item.file_size}</span>}
                  <span>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      color: item.is_public ? '#10b981' : '#f59e0b',
                      fontWeight: 600,
                    }}
                  >
                    {item.is_public ? <Eye size={11} /> : <EyeOff size={11} />}
                    {item.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleTogglePublic(item.id, item.is_public)}
                  disabled={isPending}
                  title={item.is_public ? 'Make Private Vault Only' : 'Show on Public Portfolio'}
                  style={{ fontSize: '11px', gap: '4px' }}
                >
                  {item.is_public ? <EyeOff size={12} /> : <Eye size={12} />}
                  {item.is_public ? 'Make Private' : 'Make Public'}
                </button>

                <div className={styles.actionBtns}>
                  <button
                    type="button"
                    className={`${styles.btnAction} ${styles.btnWhatsApp}`}
                    onClick={() => handleWhatsAppShare(item)}
                    title="Send raw sample to client on WhatsApp"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnAction} ${styles.btnCopy}`}
                    onClick={() => handleCopyLink(item.file_url)}
                    title="Copy direct file URL"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnAction} ${styles.btnDelete}`}
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={isPending}
                    title="Delete sample"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
