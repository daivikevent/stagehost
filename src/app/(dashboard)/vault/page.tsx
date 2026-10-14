import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getMyProfile } from '@/lib/actions/profile';
import { getMyRawMedia, getArtistStorageUsage } from '@/lib/actions/raw-media';
import { RawMediaVaultClient } from './RawMediaVaultClient';

export const metadata: Metadata = {
  title: 'Raw Media & Audio Vault | BookMyArtist',
  description: 'Manage unedited live performance video clips and raw MP3 audio demos for event clients.',
};

export const dynamic = 'force-dynamic';

export default async function VaultPage() {
  const profile = await getMyProfile();

  if (!profile) {
    redirect('/login');
  }

  const [rawMediaItems, storageUsage] = await Promise.all([
    getMyRawMedia(),
    getArtistStorageUsage(),
  ]);

  return (
    <RawMediaVaultClient
      initialItems={rawMediaItems}
      initialStorageUsage={storageUsage}
      artistName={profile.name || 'Artist'}
      artistSlug={profile.slug || ''}
    />
  );
}
