'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Sliders,
  RefreshCw,
  Eye,
  Check,
  Loader2,
  Monitor,
  Smartphone,
  Layout,
  Lock,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useBrand } from '@/contexts/BrandContext';
import { uploadBrandLogo, saveBrandSettings } from '@/lib/actions/brand';
import { DEFAULT_BRAND_SETTINGS, BrandSettings } from '@/types/brand';
import styles from './BrandLogoSettingsCard.module.css';

interface BrandLogoSettingsCardProps {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
}

export function BrandLogoSettingsCard({ settings, onSettingChange }: BrandLogoSettingsCardProps) {
  const { success, error: showError } = useToast();
  const { brand, updateBrand } = useBrand();

  const [activeTab, setActiveTab] = useState<'navbar' | 'mobile' | 'sidebar' | 'auth' | 'quotation'>('navbar');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  // Active values (with fallback to defaults)
  const logoUrl = settings.brand_logo_url || brand.logoUrl || DEFAULT_BRAND_SETTINGS.logoUrl;
  const logoIconUrl = settings.brand_logo_icon_url || brand.logoIconUrl || DEFAULT_BRAND_SETTINGS.logoIconUrl;
  const navbarHeight = Number(settings.brand_logo_navbar_height || brand.navbarHeight || DEFAULT_BRAND_SETTINGS.navbarHeight);
  const navbarMobileHeight = Number(settings.brand_logo_navbar_mobile_height || brand.navbarMobileHeight || DEFAULT_BRAND_SETTINGS.navbarMobileHeight);
  const footerHeight = Number(settings.brand_logo_footer_height || brand.footerHeight || DEFAULT_BRAND_SETTINGS.footerHeight);
  const sidebarHeight = Number(settings.brand_logo_sidebar_height || brand.sidebarHeight || DEFAULT_BRAND_SETTINGS.sidebarHeight);
  const sidebarIconSize = Number(settings.brand_logo_sidebar_icon_size || brand.sidebarIconSize || DEFAULT_BRAND_SETTINGS.sidebarIconSize);
  const authHeight = Number(settings.brand_logo_auth_height || brand.authHeight || DEFAULT_BRAND_SETTINGS.authHeight);
  const quotationHeight = Number(settings.brand_logo_quotation_height || brand.quotationHeight || DEFAULT_BRAND_SETTINGS.quotationHeight);

  // Handle setting and live CSS update
  const handleSizeChange = (key: string, numVal: number, brandKey: keyof BrandSettings) => {
    onSettingChange(key, String(numVal));
    updateBrand({ [brandKey]: numVal });
  };

  const handleUrlChange = (key: string, url: string, brandKey: keyof BrandSettings) => {
    onSettingChange(key, url);
    updateBrand({ [brandKey]: url });
  };

  // Upload Logo handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isIcon: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isIcon) setIsUploadingIcon(true);
    else setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadBrandLogo(formData);

      if (res.success && res.url) {
        if (isIcon) {
          handleUrlChange('brand_logo_icon_url', res.url, 'logoIconUrl');
          success('App icon mark uploaded successfully!');
        } else {
          handleUrlChange('brand_logo_url', res.url, 'logoUrl');
          success('Primary brand logo uploaded successfully!');
        }
      } else {
        showError(res.error || 'Failed to upload image file');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      if (isIcon) {
        setIsUploadingIcon(false);
        if (iconFileInputRef.current) iconFileInputRef.current.value = '';
      } else {
        setIsUploadingLogo(false);
        if (logoFileInputRef.current) logoFileInputRef.current.value = '';
      }
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    handleUrlChange('brand_logo_url', DEFAULT_BRAND_SETTINGS.logoUrl, 'logoUrl');
    handleUrlChange('brand_logo_icon_url', DEFAULT_BRAND_SETTINGS.logoIconUrl, 'logoIconUrl');
    handleSizeChange('brand_logo_navbar_height', DEFAULT_BRAND_SETTINGS.navbarHeight, 'navbarHeight');
    handleSizeChange('brand_logo_navbar_mobile_height', DEFAULT_BRAND_SETTINGS.navbarMobileHeight, 'navbarMobileHeight');
    handleSizeChange('brand_logo_footer_height', DEFAULT_BRAND_SETTINGS.footerHeight, 'footerHeight');
    handleSizeChange('brand_logo_sidebar_height', DEFAULT_BRAND_SETTINGS.sidebarHeight, 'sidebarHeight');
    handleSizeChange('brand_logo_sidebar_icon_size', DEFAULT_BRAND_SETTINGS.sidebarIconSize, 'sidebarIconSize');
    handleSizeChange('brand_logo_auth_height', DEFAULT_BRAND_SETTINGS.authHeight, 'authHeight');
    handleSizeChange('brand_logo_quotation_height', DEFAULT_BRAND_SETTINGS.quotationHeight, 'quotationHeight');
    success('Reset logo URLs and all placement sizes to official defaults!');
  };

  // Instant save
  const handleSaveBrand = async () => {
    setIsSaving(true);
    try {
      await saveBrandSettings({
        logoUrl,
        logoIconUrl,
        navbarHeight,
        navbarMobileHeight,
        footerHeight,
        sidebarHeight,
        sidebarIconSize,
        authHeight,
        quotationHeight,
      });
      success('Brand logo and all placement sizes saved permanently!');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save brand settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Section Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.badge}>
            <Sparkles size={13} /> BRANDING STUDIO
          </div>
          <h3 className={styles.title}>Global Logo & Multi-Placement Sizing</h3>
          <p className={styles.subtitle}>
            Upload your official brand logo &amp; icon, and customize the exact display height for every location across the website.
          </p>
        </div>
        <div className={styles.actionButtons}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleResetDefaults}
            title="Reset to official 3D Neon logo and recommended sizes"
          >
            <RefreshCw size={14} /> Reset Defaults
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleSaveBrand}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
            Save Brand Logo
          </button>
        </div>
      </div>

      {/* Main Grid: Uploads + Sizing Controls */}
      <div className={styles.contentGrid}>
        {/* Left Column: Asset Uploads */}
        <div className={styles.assetsCol}>
          {/* Primary Logo (Horizontal) */}
          <div className={styles.assetCard}>
            <div className={styles.assetHeader}>
              <div>
                <span className={styles.assetLabel}>Primary Horizontal Logo</span>
                <span className={styles.assetDesc}>Used in Header Navbar, Footer, Auth pages &amp; Invoices</span>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => logoFileInputRef.current?.click()}
                disabled={isUploadingLogo}
              >
                {isUploadingLogo ? <Loader2 size={12} className="spin" /> : <Upload size={12} />}
                Upload New
              </button>
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, false)}
              />
            </div>

            <div className={styles.previewBox}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Primary Logo" className={styles.previewImg} style={{ maxHeight: '56px' }} />
            </div>

            <div className={styles.urlInputRow}>
              <span className={styles.inputPrefix}>URL:</span>
              <input
                type="text"
                className={styles.urlInput}
                value={logoUrl}
                onChange={(e) => handleUrlChange('brand_logo_url', e.target.value, 'logoUrl')}
                placeholder="/images/logo.png or https://..."
              />
            </div>
          </div>

          {/* Compact Icon Mark (Square) */}
          <div className={styles.assetCard}>
            <div className={styles.assetHeader}>
              <div>
                <span className={styles.assetLabel}>Square Icon Mark</span>
                <span className={styles.assetDesc}>Used in Collapsed Sidebar, Mobile Menu &amp; App Icon</span>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => iconFileInputRef.current?.click()}
                disabled={isUploadingIcon}
              >
                {isUploadingIcon ? <Loader2 size={12} className="spin" /> : <Upload size={12} />}
                Upload New
              </button>
              <input
                ref={iconFileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, true)}
              />
            </div>

            <div className={styles.previewBox}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoIconUrl} alt="App Icon Mark" className={styles.previewImg} style={{ maxHeight: '48px', maxWidth: '48px' }} />
            </div>

            <div className={styles.urlInputRow}>
              <span className={styles.inputPrefix}>URL:</span>
              <input
                type="text"
                className={styles.urlInput}
                value={logoIconUrl}
                onChange={(e) => handleUrlChange('brand_logo_icon_url', e.target.value, 'logoIconUrl')}
                placeholder="/images/logo-icon.png or https://..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Placement Size Sliders */}
        <div className={styles.slidersCol}>
          <div className={styles.slidersHeader}>
            <Sliders size={16} /> Placement Display Heights
          </div>

          {/* 1. Header Desktop */}
          <div className={styles.sliderItem}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderLabel}>
                <Monitor size={14} /> Desktop Header / Navbar Height
              </span>
              <span className={styles.sliderValueBadge}>{navbarHeight}px</span>
            </div>
            <div className={styles.sliderControlRow}>
              <input
                type="range"
                min="24"
                max="70"
                step="1"
                value={navbarHeight}
                onChange={(e) => handleSizeChange('brand_logo_navbar_height', Number(e.target.value), 'navbarHeight')}
                className={styles.rangeInput}
              />
              <input
                type="number"
                min="24"
                max="70"
                value={navbarHeight}
                onChange={(e) => handleSizeChange('brand_logo_navbar_height', Number(e.target.value), 'navbarHeight')}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* 2. Header Mobile */}
          <div className={styles.sliderItem}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderLabel}>
                <Smartphone size={14} /> Mobile Header / Navbar Height
              </span>
              <span className={styles.sliderValueBadge}>{navbarMobileHeight}px</span>
            </div>
            <div className={styles.sliderControlRow}>
              <input
                type="range"
                min="20"
                max="50"
                step="1"
                value={navbarMobileHeight}
                onChange={(e) => handleSizeChange('brand_logo_navbar_mobile_height', Number(e.target.value), 'navbarMobileHeight')}
                className={styles.rangeInput}
              />
              <input
                type="number"
                min="20"
                max="50"
                value={navbarMobileHeight}
                onChange={(e) => handleSizeChange('brand_logo_navbar_mobile_height', Number(e.target.value), 'navbarMobileHeight')}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* 3. Footer */}
          <div className={styles.sliderItem}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderLabel}>
                <Layout size={14} /> Footer Logo Height
              </span>
              <span className={styles.sliderValueBadge}>{footerHeight}px</span>
            </div>
            <div className={styles.sliderControlRow}>
              <input
                type="range"
                min="24"
                max="70"
                step="1"
                value={footerHeight}
                onChange={(e) => handleSizeChange('brand_logo_footer_height', Number(e.target.value), 'footerHeight')}
                className={styles.rangeInput}
              />
              <input
                type="number"
                min="24"
                max="70"
                value={footerHeight}
                onChange={(e) => handleSizeChange('brand_logo_footer_height', Number(e.target.value), 'footerHeight')}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* 4. Sidebar Expanded */}
          <div className={styles.sliderItem}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderLabel}>
                <Layout size={14} /> Dashboard / Admin Sidebar (Expanded)
              </span>
              <span className={styles.sliderValueBadge}>{sidebarHeight}px</span>
            </div>
            <div className={styles.sliderControlRow}>
              <input
                type="range"
                min="20"
                max="60"
                step="1"
                value={sidebarHeight}
                onChange={(e) => handleSizeChange('brand_logo_sidebar_height', Number(e.target.value), 'sidebarHeight')}
                className={styles.rangeInput}
              />
              <input
                type="number"
                min="20"
                max="60"
                value={sidebarHeight}
                onChange={(e) => handleSizeChange('brand_logo_sidebar_height', Number(e.target.value), 'sidebarHeight')}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* 5. Sidebar Collapsed Icon */}
          <div className={styles.sliderItem}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderLabel}>
                <ImageIcon size={14} /> Sidebar Icon Size (Collapsed Mode)
              </span>
              <span className={styles.sliderValueBadge}>{sidebarIconSize}px</span>
            </div>
            <div className={styles.sliderControlRow}>
              <input
                type="range"
                min="20"
                max="50"
                step="1"
                value={sidebarIconSize}
                onChange={(e) => handleSizeChange('brand_logo_sidebar_icon_size', Number(e.target.value), 'sidebarIconSize')}
                className={styles.rangeInput}
              />
              <input
                type="number"
                min="20"
                max="50"
                value={sidebarIconSize}
                onChange={(e) => handleSizeChange('brand_logo_sidebar_icon_size', Number(e.target.value), 'sidebarIconSize')}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* 6. Auth Pages */}
          <div className={styles.sliderItem}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderLabel}>
                <Lock size={14} /> Auth Pages (Login &amp; Register)
              </span>
              <span className={styles.sliderValueBadge}>{authHeight}px</span>
            </div>
            <div className={styles.sliderControlRow}>
              <input
                type="range"
                min="28"
                max="90"
                step="1"
                value={authHeight}
                onChange={(e) => handleSizeChange('brand_logo_auth_height', Number(e.target.value), 'authHeight')}
                className={styles.rangeInput}
              />
              <input
                type="number"
                min="28"
                max="90"
                value={authHeight}
                onChange={(e) => handleSizeChange('brand_logo_auth_height', Number(e.target.value), 'authHeight')}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* 7. PDF Quotation */}
          <div className={styles.sliderItem}>
            <div className={styles.sliderLabelRow}>
              <span className={styles.sliderLabel}>
                <FileText size={14} /> PDF Quotation / Proposal Header
              </span>
              <span className={styles.sliderValueBadge}>{quotationHeight}px</span>
            </div>
            <div className={styles.sliderControlRow}>
              <input
                type="range"
                min="24"
                max="70"
                step="1"
                value={quotationHeight}
                onChange={(e) => handleSizeChange('brand_logo_quotation_height', Number(e.target.value), 'quotationHeight')}
                className={styles.rangeInput}
              />
              <input
                type="number"
                min="24"
                max="70"
                value={quotationHeight}
                onChange={(e) => handleSizeChange('brand_logo_quotation_height', Number(e.target.value), 'quotationHeight')}
                className={styles.numInput}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive Placement Simulator */}
      <div className={styles.simulatorCard}>
        <div className={styles.simulatorHeader}>
          <div className={styles.simulatorTitle}>
            <Eye size={16} /> Live Multi-Screen Preview Simulator
          </div>
          <div className={styles.tabList}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'navbar' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('navbar')}
            >
              <Monitor size={12} /> Header (Desktop)
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'mobile' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('mobile')}
            >
              <Smartphone size={12} /> Header (Mobile)
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'sidebar' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('sidebar')}
            >
              <Layout size={12} /> Sidebar Navigation
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'auth' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('auth')}
            >
              <Lock size={12} /> Auth Screen
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'quotation' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('quotation')}
            >
              <FileText size={12} /> PDF Proposal
            </button>
          </div>
        </div>

        <div className={styles.stageWindow}>
          {activeTab === 'navbar' && (
            <div className={styles.mockDesktopNav}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Logo" style={{ height: `${navbarHeight}px`, width: 'auto', objectFit: 'contain' }} />
              <div className={styles.mockNavLinks}>
                <span>Features</span>
                <span>How It Works</span>
                <span>Pricing</span>
                <span>Find Artists</span>
                <button className="btn btn-xs btn-primary">Join as Artist</button>
              </div>
            </div>
          )}

          {activeTab === 'mobile' && (
            <div className={styles.mockMobileWrapper}>
              <div className={styles.mockMobileNav}>
                <div style={{ fontSize: '18px', color: '#999' }}>☰</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo" style={{ height: `${navbarMobileHeight}px`, width: 'auto', objectFit: 'contain' }} />
                <button className="btn btn-xs btn-primary" style={{ fontSize: '10px', padding: '3px 8px' }}>Log In</button>
              </div>
            </div>
          )}

          {activeTab === 'sidebar' && (
            <div className={styles.mockSidebarWrapper}>
              {/* Expanded Sidebar */}
              <div className={styles.mockSidebarExpanded}>
                <div className={styles.mockSidebarHeader}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo" style={{ height: `${sidebarHeight}px`, width: 'auto', objectFit: 'contain' }} />
                </div>
                <div className={styles.mockSidebarItems}>
                  <div className={styles.mockActiveItem}>📊 Dashboard</div>
                  <div>👤 Profile</div>
                  <div>📅 Schedule</div>
                  <div>💬 Inquiries</div>
                </div>
              </div>

              {/* Collapsed Sidebar */}
              <div className={styles.mockSidebarCollapsed}>
                <div className={styles.mockSidebarHeader} style={{ justifyContent: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoIconUrl} alt="Icon" style={{ height: `${sidebarIconSize}px`, width: `${sidebarIconSize}px`, objectFit: 'contain' }} />
                </div>
                <div className={styles.mockSidebarItems} style={{ alignItems: 'center' }}>
                  <div className={styles.mockActiveDot} />
                  <div className={styles.mockDot} />
                  <div className={styles.mockDot} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className={styles.mockAuthCard}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo" style={{ height: `${authHeight}px`, width: 'auto', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
              </div>
              <h4 style={{ fontSize: '14px', margin: '0 0 6px 0', textAlign: 'center' }}>Welcome Back</h4>
              <p style={{ fontSize: '11px', color: '#999', margin: '0 0 12px 0', textAlign: 'center' }}>Log in to manage your bookings</p>
              <div style={{ height: '28px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '8px' }} />
              <div style={{ height: '28px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '12px' }} />
              <button className="btn btn-xs btn-primary btn-block">Sign In</button>
            </div>
          )}

          {activeTab === 'quotation' && (
            <div className={styles.mockQuotationHeader}>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo" style={{ height: `${quotationHeight}px`, width: 'auto', objectFit: 'contain', display: 'block', marginBottom: '4px' }} />
                <span style={{ fontSize: '9px', background: '#ff007a', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                  VERIFIED TALENT
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#D4AF37' }}>PERFORMANCE PROPOSAL</div>
                <div style={{ fontSize: '10px', color: '#888' }}>Ref: BMA-2026-0842</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
