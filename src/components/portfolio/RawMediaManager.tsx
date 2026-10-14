'use client';

import { useState, useTransition, useRef } from 'react';
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
  Loader2,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  type RawMediaItem,
  uploadRawMediaFile,
  addRawMediaItem,
  updateRawMediaItem,
  deleteRawMediaItem,
} from '@/lib/actions/raw-media';
import portfolioStyles from '@/app/(dashboard)/portfolio/portfolio.module.css';
import styles from '@/app/(dashboard)/vault/RawMediaVaultClient.module.css';

interface RawMediaManagerProps {
  initialItems: RawMediaItem[];
  artistSlug: string;
  artistName: string;
}

export function RawMediaManager({
  initialItems = [],
  artistSlug,
  artistName,
}: RawMediaManagerProps) {
  const { success, error: showError } = useToast();

  const [items, setItems] = useState<RawMediaItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
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

  // Active preview item for modal
  const [previewItem, setPreviewItem] = useState<RawMediaItem | null>(null);

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
          drive_file_id: uploadRes.driveFileId,
          drive_web_view_link: uploadRes.driveWebViewLink,
        });

        setItems((prev) => [newItem, ...prev]);
        success('Work sample uploaded and saved to vault successfully!');
        resetForm();
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
    <div
      id="raw-media-vault"
      className={portfolioStyles.formSection}
      style={{
        border: '1px solid rgba(6, 182, 212, 0.35)',
        background: 'rgba(6, 182, 212, 0.02)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className={portfolioStyles.sectionTitle} style={{ margin: 0 }}>
              <Music size={20} color="#06b6d4" /> Raw Videos &amp; MP3 Audio Vault
            </h3>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06b6d4',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Direct Client Sharing
            </span>
          </div>
          <p className="text-xs text-secondary" style={{ marginTop: '4px', maxWidth: '680px' }}>
            Upload unedited raw video footage (.mp4, .mov, .webm) and vocal/music tracks (.mp3, .wav)
            of your authentic work. Share 1-click preview links directly on WhatsApp with event planners or display them on your public portfolio.
          </p>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '12px', background: 'rgba(6, 182, 212, 0.2)', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#67e8f9' }}>
          {items.length} {items.length === 1 ? 'Sample' : 'Samples'} in Vault
        </span>
      </div>

      {/* Upload Studio Form */}
      <div
        style={{
          padding: '18px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
        }}
      >
        <div className={styles.uploadTabs} style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={`${styles.uploadTabBtn} ${activeTab === 'upload' ? styles.uploadTabActive : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={14} /> Upload Direct File (.mp4 / .mov / .mp3 / .wav)
          </button>
          <button
            type="button"
            className={`${styles.uploadTabBtn} ${activeTab === 'link' ? styles.uploadTabActive : ''}`}
            onClick={() => setActiveTab('link')}
          >
            <LinkIcon size={14} /> External Cloud Link (Drive / Dropbox)
          </button>
        </div>

        <form onSubmit={handleCreateMedia}>
          {activeTab === 'upload' ? (
            <div>
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ''}`}
                style={{ padding: '24px 16px', marginBottom: '16px' }}
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
                      <Music size={24} color="#06b6d4" />
                    ) : (
                      <Film size={24} color="#06b6d4" />
                    )
                  ) : (
                    <Upload size={24} color="#06b6d4" />
                  )}
                </div>

                {selectedFile ? (
                  <div>
                    <p className={styles.dropzoneTitle} style={{ color: '#06b6d4' }}>{selectedFile.name}</p>
                    <p className={styles.dropzoneText}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · Ready to upload
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className={styles.dropzoneTitle}>Click or Drag Raw Video / Audio File here</p>
                    <p className={styles.dropzoneText}>
                      Supports MP4, MOV, WebM raw stage videos &amp; MP3, WAV, M4A audios
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
                <div style={{ marginBottom: '16px' }}>
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
                        background: '#06b6d4',
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
                    <span>Uploading work sample to media vault...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <div className="input-group">
                <label className="input-label">External File Link (Google Drive / Dropbox / Direct URL) *</label>
                <input
                  type="url"
                  required
                  className="input"
                  placeholder="https://drive.google.com/file/d/... or direct media link"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div className="input-group">
              <label className="input-label">Work Sample Title *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. Sangeet Live Emcee Interaction (Raw)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Event / Occasion Name (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Destination Wedding in Udaipur"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Media Type</label>
              <select
                className="input"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'video' | 'audio')}
              >
                <option value="video">Raw Video (.mp4 / .mov)</option>
                <option value="audio">MP3 Audio Track (.mp3 / .wav)</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#06b6d4' }}
              />
              <span>Show on Public Portfolio (under &quot;Raw Work Samples&quot;)</span>
            </label>

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', borderColor: '#06b6d4' }}
              disabled={isUploading || isPending || (activeTab === 'upload' && !selectedFile) || (activeTab === 'link' && !externalUrl.trim())}
            >
              {isUploading || isPending ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Saving to Vault...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Add to Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Bar */}
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-xs ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Samples ({items.length})
          </button>
          <button
            type="button"
            className={`btn btn-xs ${filter === 'video' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('video')}
          >
            <Film size={12} /> Videos ({videoCount})
          </button>
          <button
            type="button"
            className={`btn btn-xs ${filter === 'audio' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('audio')}
          >
            <Music size={12} /> Audios ({audioCount})
          </button>
          <button
            type="button"
            className={`btn btn-xs ${filter === 'public' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('public')}
          >
            Public ({items.filter((i) => i.is_public).length})
          </button>
        </div>
      )}

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 16px', background: 'transparent' }}>
          <Music size={32} color="var(--color-text-tertiary)" />
          <div className="empty-state-title" style={{ fontSize: '15px', marginTop: '8px' }}>
            No Raw Work Samples Added Yet
          </div>
          <p className="text-xs text-tertiary" style={{ maxWidth: '420px', margin: '4px auto 0' }}>
            Upload your unedited video footage and live audio clips above. You can share them via WhatsApp with event planners in 1-click!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filteredItems.map((item) => {
            const isVid = item.media_type === 'video';
            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Media Preview Player */}
                <div
                  style={{
                    height: '140px',
                    background: '#090b12',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isVid ? (
                    <video
                      src={item.file_url}
                      controls
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(6, 182, 212, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#06b6d4',
                        }}
                      >
                        <Music size={20} />
                      </div>
                      <audio
                        src={item.file_url}
                        controls
                        preload="metadata"
                        style={{ width: '90%', height: '32px' }}
                      />
                    </div>
                  )}

                  {/* Type Badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(0,0,0,0.7)',
                      color: isVid ? '#67e8f9' : '#a78bfa',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {isVid ? 'Raw Video' : 'MP3 Audio'}
                  </span>
                </div>

                {/* Details */}
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#fff',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </h4>
                    {item.event_name && (
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>
                        📍 {item.event_name}
                      </p>
                    )}
                    {item.file_size && (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', display: 'inline-block' }}>
                        Size: {item.file_size}
                      </span>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* WhatsApp 1-Click Share */}
                    <button
                      type="button"
                      onClick={() => handleWhatsAppShare(item)}
                      style={{
                        background: '#25D366',
                        border: 'none',
                        color: '#000',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        padding: '4px 8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                      }}
                      title="Share with event client on WhatsApp"
                    >
                      <MessageCircle size={12} fill="#000" />
                      <span>WhatsApp</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {/* Public Toggle */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublic(item.id, item.is_public)}
                        style={{
                          background: item.is_public ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${item.is_public ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: item.is_public ? '#34d399' : 'rgba(255, 255, 255, 0.4)',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10px',
                          fontWeight: 600,
                        }}
                        title={item.is_public ? 'Visible on public portfolio' : 'Private (direct link only)'}
                      >
                        {item.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{item.is_public ? 'Public' : 'Private'}</span>
                      </button>

                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(item.file_url)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                        }}
                        title="Copy direct file URL"
                      >
                        <Copy size={12} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                        }}
                        title="Delete work sample"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
