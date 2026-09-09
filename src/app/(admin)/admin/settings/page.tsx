import { getPlatformSettings, getAnnouncementBanner, getCustomDomains } from '@/lib/actions/admin';
import { SettingsFormClient } from './SettingsFormClient';

export default async function AdminSettingsPage() {
  const [settings, banner, customDomains] = await Promise.all([
    getPlatformSettings(),
    getAnnouncementBanner(),
    getCustomDomains(),
  ]);
  return (
    <SettingsFormClient
      initialSettings={settings}
      initialBanner={banner}
      initialCustomDomains={customDomains}
    />
  );
}

