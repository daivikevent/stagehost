'use client';

import React, { useState } from 'react';
import { useBrand } from '@/contexts/BrandContext';
import styles from './BrandLogo.module.css';

export interface BrandLogoProps {
  variant?: 'navbar' | 'navbar-mobile' | 'footer' | 'sidebar' | 'sidebar-icon' | 'auth' | 'quotation' | 'custom';
  src?: string;
  customHeight?: number;
  customWidth?: number;
  alt?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function BrandLogo({
  variant = 'navbar',
  src,
  customHeight,
  customWidth,
  alt = 'BookMyArtist',
  className = '',
  style = {},
}: BrandLogoProps) {
  const { brand } = useBrand();
  const [hasError, setHasError] = useState(false);

  // Determine variant class
  let variantClass = styles.variantNavbar;
  if (variant === 'navbar-mobile') variantClass = styles.variantNavbarMobile;
  else if (variant === 'footer') variantClass = styles.variantFooter;
  else if (variant === 'sidebar') variantClass = styles.variantSidebar;
  else if (variant === 'sidebar-icon') variantClass = styles.variantSidebarIcon;
  else if (variant === 'auth') variantClass = styles.variantAuth;
  else if (variant === 'quotation') variantClass = styles.variantQuotation;

  // Determine resolved source from props or brand context
  const isIconOnly = variant === 'sidebar-icon';
  const defaultFallback = isIconOnly ? '/images/logo-icon.png' : '/images/logo.png';
  const contextSrc = isIconOnly ? (brand?.logoIconUrl || defaultFallback) : (brand?.logoUrl || defaultFallback);
  const resolvedSrc = src || contextSrc;

  // Custom inline style overrides if specifically provided
  const inlineStyle: React.CSSProperties = { ...style };
  if (customHeight) {
    inlineStyle.height = `${customHeight}px`;
    inlineStyle.width = customWidth ? `${customWidth}px` : 'auto';
  }

  if (hasError) {
    return (
      <span className={`${styles.logoContainer} ${className}`} style={inlineStyle}>
        <span className={styles.fallbackMark}>
          <span className={styles.fallbackDot} />
          <span>BookMyArtist</span>
        </span>
      </span>
    );
  }

  return (
    <span className={`${styles.logoContainer} ${variantClass} ${className}`} style={inlineStyle}>
      <img
        src={resolvedSrc}
        alt={alt}
        className={styles.logoImg}
        onError={() => setHasError(true)}
        loading={variant === 'navbar' || variant === 'auth' || variant === 'sidebar' ? 'eager' : 'lazy'}
      />
    </span>
  );
}
