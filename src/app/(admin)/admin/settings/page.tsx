import { getPlatformSettings, getAnnouncementBanner, getCustomDomains } from '@/lib/actions/admin';
import { getPlatformTaxonomy } from '@/lib/actions/taxonomy';
import { SettingsFormClient } from './SettingsFormClient';

export default async function AdminSettingsPage() {
  const [settings, banner, customDomains, taxonomy] = await Promise.all([
    getPlatformSettings(),
    getAnnouncementBanner(),
    getCustomDomains(),
    getPlatformTaxonomy(),
  ]);

  return (
    <SettingsFormClient
      initialSettings={settings}
      initialBanner={banner}
      initialCustomDomains={customDomains}
      initialTaxonomy={taxonomy}
    />
  );
}
