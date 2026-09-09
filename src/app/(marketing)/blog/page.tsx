import { getPageContent } from '@/lib/actions/pages';
import type { BlogContent } from '@/types/pages';
import { BlogClient } from './BlogClient';

export const metadata = {
  title: 'Blog & Anchor Guides | StageHost',
  description: 'Stagecraft playbooks, emcee pricing strategies, and event management insights for live hosts in India.',
};

export default async function BlogPage() {
  const content = await getPageContent<BlogContent>('blog');
  return <BlogClient content={content} />;
}
