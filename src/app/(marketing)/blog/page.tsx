import { getPageContent } from '@/lib/actions/pages';
import type { BlogContent } from '@/types/pages';
import { BlogClient } from './BlogClient';

export const metadata = {
  title: 'Blog & Artist Guides | BookMyArtist',
  description: 'Stagecraft playbooks, artist pricing strategies, and event management insights for live performers in India.',
};

export default async function BlogPage() {
  const content = await getPageContent<BlogContent>('blog');
  return <BlogClient content={content} />;
}
