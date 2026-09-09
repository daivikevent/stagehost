import { getDirectoryAnchors } from '@/lib/actions/profile';
import { DirectoryClient, type DirectoryAnchor } from './DirectoryClient';

export const metadata = {
  title: 'Find Event Anchors & Emcees | StageHost Directory',
  description: 'Browse top verified event anchors, wedding emcees, and corporate hosts across India.',
};

export default async function DirectoryPage() {
  const anchors = await getDirectoryAnchors();
  return <DirectoryClient initialAnchors={anchors as DirectoryAnchor[]} />;
}
