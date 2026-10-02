import { getDirectoryAnchors } from '@/lib/actions/profile';
import { DirectoryClient, type DirectoryAnchor } from './DirectoryClient';

export const metadata = {
  title: 'Find Live Artists, Anchors & Performers | BookMyArtist Directory',
  description: 'Browse top verified live artists, anchors, emcees, DJs, singers, comedians, and performers across India.',
};

export default async function DirectoryPage() {
  const anchors = await getDirectoryAnchors();
  return <DirectoryClient initialAnchors={anchors as DirectoryAnchor[]} />;
}
