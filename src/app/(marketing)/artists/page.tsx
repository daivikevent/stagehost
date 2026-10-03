import { getDirectoryAnchors } from '@/lib/actions/profile';
import { DirectoryClient, type DirectoryAnchor } from '../directory/DirectoryClient';

export const metadata = {
  title: 'Find Top Performing Artists, Anchors, DJs & Singers | BookMyArtist Directory',
  description: 'Browse verified live artists, anchors, emcees, DJs, singers, standup comedians, live bands, and performers across India. Check live availability, watch video showreels, and book directly on WhatsApp.',
};

export default async function ArtistsDirectoryPage() {
  const anchors = await getDirectoryAnchors();
  return <DirectoryClient initialAnchors={anchors as DirectoryAnchor[]} />;
}
