import { getAdminThemesList } from '@/lib/actions/admin';
import { getGlobalSiteTheme, getCustomSiteThemes } from '@/lib/actions/themes';
import { ThemesClient } from './ThemesClient';

export default async function AdminThemesPage() {
  const [themes, siteTheme, customSiteThemes] = await Promise.all([
    getAdminThemesList(),
    getGlobalSiteTheme(),
    getCustomSiteThemes(),
  ]);

  return (
    <ThemesClient
      initialThemes={themes}
      initialSiteTheme={siteTheme}
      initialCustomSiteThemes={customSiteThemes}
    />
  );
}

