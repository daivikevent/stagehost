'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandSettings, DEFAULT_BRAND_SETTINGS } from '@/types/brand';

interface BrandContextType {
  brand: BrandSettings;
  updateBrand: (next: Partial<BrandSettings>) => void;
}

const BrandContext = createContext<BrandContextType>({
  brand: DEFAULT_BRAND_SETTINGS,
  updateBrand: () => {},
});

export function BrandProvider({
  initialSettings,
  children,
}: {
  initialSettings?: BrandSettings;
  children: React.ReactNode;
}) {
  const [brand, setBrand] = useState<BrandSettings>(initialSettings || DEFAULT_BRAND_SETTINGS);

  const updateBrand = (next: Partial<BrandSettings>) => {
    setBrand((prev) => {
      const updated = { ...prev, ...next };
      // Also update CSS variables in real time for immediate visual responsiveness
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (updated.navbarHeight) root.style.setProperty('--brand-logo-navbar-h', `${updated.navbarHeight}px`);
        if (updated.navbarMobileHeight) root.style.setProperty('--brand-logo-navbar-mobile-h', `${updated.navbarMobileHeight}px`);
        if (updated.footerHeight) root.style.setProperty('--brand-logo-footer-h', `${updated.footerHeight}px`);
        if (updated.sidebarHeight) root.style.setProperty('--brand-logo-sidebar-h', `${updated.sidebarHeight}px`);
        if (updated.sidebarIconSize) root.style.setProperty('--brand-logo-sidebar-icon-size', `${updated.sidebarIconSize}px`);
        if (updated.authHeight) root.style.setProperty('--brand-logo-auth-h', `${updated.authHeight}px`);
        if (updated.quotationHeight) root.style.setProperty('--brand-logo-quotation-h', `${updated.quotationHeight}px`);
      }
      return updated;
    });
  };

  // Sync CSS variables on mount or when brand changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--brand-logo-navbar-h', `${brand.navbarHeight}px`);
      root.style.setProperty('--brand-logo-navbar-mobile-h', `${brand.navbarMobileHeight}px`);
      root.style.setProperty('--brand-logo-footer-h', `${brand.footerHeight}px`);
      root.style.setProperty('--brand-logo-sidebar-h', `${brand.sidebarHeight}px`);
      root.style.setProperty('--brand-logo-sidebar-icon-size', `${brand.sidebarIconSize}px`);
      root.style.setProperty('--brand-logo-auth-h', `${brand.authHeight}px`);
      root.style.setProperty('--brand-logo-quotation-h', `${brand.quotationHeight}px`);
    }
  }, [brand]);

  return (
    <BrandContext.Provider value={{ brand, updateBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
