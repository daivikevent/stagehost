export interface BrandSettings {
  logoUrl: string;
  logoIconUrl: string;
  navbarHeight: number;
  navbarMobileHeight: number;
  footerHeight: number;
  sidebarHeight: number;
  sidebarIconSize: number;
  authHeight: number;
  quotationHeight: number;
}

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  logoUrl: '/images/logo.png',
  logoIconUrl: '/images/logo-icon.png',
  navbarHeight: 42,
  navbarMobileHeight: 32,
  footerHeight: 38,
  sidebarHeight: 34,
  sidebarIconSize: 32,
  authHeight: 48,
  quotationHeight: 40,
};
