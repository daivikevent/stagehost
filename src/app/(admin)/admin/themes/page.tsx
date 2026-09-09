import { getAdminThemesList } from '@/lib/actions/admin';
import { getGlobalSiteTheme } from '@/lib/actions/themes';
import { ThemesClient } from './ThemesClient';

export default async function AdminThemesPage() {
  const [themes, siteTheme] = await Promise.all([
    getAdminThemesList(),
    getGlobalSiteTheme(),
  ]);

  return <ThemesClient initialThemes={themes} initialSiteTheme={siteTheme} />;
}

