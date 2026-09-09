'use client';

import { useState } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Edit2,
  Maximize2,
  X,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { addPhoto, updatePhoto, deletePhoto, uploadGalleryPhoto } from '@/lib/actions/photos';
import { compressImage } from '@/lib/image-compression';
import { useToast } from '@/hooks/useToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { Photo } from '@/types';
import styles from '@/app/(dashboard)/portfolio/portfolio.module.css';

interface PhotosManagerProps {
  initialPhotos: Photo[];
}

const QUICK_PHOTO_PRESETS = [
  {
    title: 'High Octane Crowd',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    caption: 'High-energy crowd interaction & music beats',
  },
  {
    title: 'Royal Varmala Dinner',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    caption: 'Royal Varmala ceremony hosting — Luxury palace setup',
  },
  {
    title: 'Grand Concert Lights',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    caption: 'Arena concert & corporate awards celebration',
  },
  {
    title: 'Vintage Microphone',
    url: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?auto=format&fit=crop&w=1200&q=80',
    caption: 'Mic in hand, zero awkward silences guaranteed',
  },
];

export function PhotosManager({ initialPhotos }: PhotosManagerProps) {
  const { success, error: showError } = useToast();
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<Photo | null>(null);
  const [editingItem, setEditingItem] = useState<Photo | null>(null);

  // Add Form State
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Edit Caption State
  const [editCaptionText, setEditCaptionText] = useState('');

  const handleOpenAddModal = () => {
    setPhotoUrl('');
    setCaption('');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, { maxWidth: 2048, maxHeight: 2048, quality: 0.85 });
      
      const autoName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      if (!caption) {
        setCaption(autoName.charAt(0).toUpperCase() + autoName.slice(1));
      }

      // 1. Try uploading directly to Supabase Media Storage CDN bucket
      try {
        const formData = new FormData();
        const uploadFile = new File([compressed], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' });
        formData.append('file', uploadFile);
        const cdnUrl = await uploadGalleryPhoto(formData);
        if (cdnUrl) {
          setPhotoUrl(cdnUrl);
          setIsCompressing(false);
          success('High-res photo optimized & saved to CDN storage!');
          return;
        }
      } catch (storageErr) {
        console.warn('Direct bucket upload fallback to compressed base64:', storageErr);
      }

      // 2. Fallback to compressed base64 data URI if bucket storage isn't reachable
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
        setIsCompressing(false);
        success('High-res photo compressed (< 400KB) and ready!');
      };
      reader.readAsDataURL(compressed);
    } catch {
      setIsCompressing(false);
      showError('Failed to process image');
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) {
      showError('Please enter an image URL');
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await addPhoto({
        url: photoUrl.trim(),
        caption: caption.trim(),
      });

      setPhotos(prev => [...prev, added]);
      success('Photo added to your Captured On Stage gallery!');
      setIsModalOpen(false);
      setPhotoUrl('');
      setCaption('');
    } catch (err: any) {
      showError(err?.message || 'Failed to add photo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditCaption = (photo: Photo) => {
    setEditingItem(photo);
    setEditCaptionText(photo.caption || '');
  };

  const handleSaveCaption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      const updated = await updatePhoto(editingItem.id, { caption: editCaptionText.trim() });
      setPhotos(prev => prev.map(p => (p.id === editingItem.id ? updated : p)));
      success('Photo caption updated!');
      setEditingItem(null);
    } catch {
      showError('Failed to update caption');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!deletingItem) return;
    try {
      await deletePhoto(deletingItem.id);
      setPhotos(prev => prev.filter(p => p.id !== deletingItem.id));
      success('Photo removed from gallery');
      setDeletingItem(null);
    } catch {
      showError('Failed to remove photo');
    }
  };

  return (
    <div className={styles.formSection}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
            <Camera size={18} color="#F59E0B" /> Captured On Stage (Photo Gallery)
          </h3>
          <span className="badge badge-warning" style={{ fontSize: '11px' }}>
            {photos.length} Photos in Gallery
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenAddModal}
          style={{ gap: '6px' }}
        >
          <Plus size={14} /> Add Stage Photo
        </button>
      </div>

      <p className="text-sm text-secondary" style={{ margin: '0 0 16px 0', maxWidth: '720px' }}>
        Upload or paste links for high-resolution performance photos. Visitors will be able to click on each image to view full-screen in a responsive lightbox on your public portfolio!
      </p>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 16px', background: 'transparent' }}>
          <ImageIcon size={36} color="var(--color-text-tertiary)" />
          <div className="empty-state-title" style={{ fontSize: '16px', marginTop: '10px' }}>
            No Stage Photos Added Yet
          </div>
          <p className="text-xs text-tertiary" style={{ maxWidth: '420px', margin: '4px auto 16px' }}>
            Showcase your stage presence, wedding moments, and crowd engagement with high-quality photos.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleOpenAddModal}
            style={{ gap: '6px' }}
          >
            <Plus size={14} /> Add First Photo
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {photos.map(photo => (
            <div
              key={photo.id}
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                position: 'relative',
              }}
            >
              {/* Photo Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  width: '100%',
                  background: '#090812',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                onClick={() => setPreviewPhoto(photo.url)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Stage moment'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1.0)')}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                  title="Click to preview full size"
                >
                  <Maximize2 size={13} />
                </div>
              </div>

              {/* Caption & Actions */}
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                  {photo.caption || <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>No caption added</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleOpenEditCaption(photo)}
                    style={{ gap: '4px' }}
                  >
                    <Edit2 size={12} /> Edit Caption
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{ color: 'var(--color-error)' }}
                    onClick={() => setDeletingItem(photo)}
                    title="Delete photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '540px',
              width: '95%',
              background: 'var(--color-bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#F59E0B" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Add Stage Photo</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPhoto}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Direct Upload Dropzone */}
                <div
                  style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                    disabled={isCompressing || isSubmitting}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <Upload size={22} color="var(--color-primary)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {isCompressing ? 'Compressing high-res image...' : 'Click or drop phone / DSLR photo here'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      Automatic client-side compression (&lt; 400KB WebP)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    OR ENTER URL
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                </div>

                <div className="input-group">
                  <label className="input-label">Image URL or Data URI *</label>
                  <input
                    className="input"
                    required
                    type="text"
                    placeholder="https://images.unsplash.com/... or paste hosted image link"
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                    Paste a direct image link (Cloudinary, Imgur, Unsplash) or upload directly above.
                  </span>
                </div>

                {/* Quick Presets Picker */}
                <div>
                  <label className="input-label" style={{ marginBottom: '6px', display: 'block' }}>
                    Or pick from sample stage presets:
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {QUICK_PHOTO_PRESETS.map(preset => (
                      <button
                        key={preset.title}
                        type="button"
                        className="badge"
                        style={{
                          background: photoUrl === preset.url ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.06)',
                          color: photoUrl === preset.url ? '#fff' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          border: 'none',
                        }}
                        onClick={() => {
                          setPhotoUrl(preset.url);
                          setCaption(preset.caption);
                        }}
                      >
                        + {preset.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview If URL Provided */}
                {photoUrl && (
                  <div
                    style={{
                      borderRadius: '10px',
                      overflow: 'hidden',
                      aspectRatio: '16/9',
                      background: '#0a0a14',
                      border: '1px solid var(--color-border)',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={photoUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    >
                      Image Preview
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Caption / Stage Description</label>
                  <input
                    className="input"
                    placeholder="e.g. Royal Varmala ceremony hosting — Fairmont Jaipur"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting || !photoUrl.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="spin" /> Adding...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Add to Gallery
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Caption Modal */}
      {editingItem && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setEditingItem(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              width: '95%',
              background: 'var(--color-bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Edit Photo Caption</h3>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setEditingItem(null)}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCaption}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                  <img src={editingItem.url} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Caption</label>
                  <input
                    className="input"
                    placeholder="Describe this stage moment..."
                    value={editCaptionText}
                    onChange={e => setEditCaptionText(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditingItem(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 size={14} className="spin" /> : 'Save Caption'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewPhoto(null)}
          style={{
            zIndex: 1100,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={previewPhoto}
              alt="Stage preview"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '14px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              }}
            />
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => setPreviewPhoto(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: 'rgba(0,0,0,0.85)',
                color: '#fff',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeletePhoto}
        title="Delete Photo?"
        description="Are you sure you want to remove this photo from your stage gallery? It will no longer appear on your public portfolio."
        confirmText="Delete Photo"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
