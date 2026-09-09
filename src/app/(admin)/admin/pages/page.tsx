import { checkIsAdmin } from '@/lib/actions/admin';
import { redirect } from 'next/navigation';
import { getPageContent } from '@/lib/actions/pages';
import type {
  PrivacyContent,
  TermsContent,
  RefundContent,
  AboutContent,
  ContactContent,
  BlogContent,
} from '@/types/pages';
import { PagesManagerClient } from './PagesManagerClient';

export const metadata = {
  title: 'Pages & Legal CMS | StageHost Admin',
  description: 'Manage legal policies, about us details, support channels, and blog articles.',
};

export default async function AdminPagesCMS() {
  const [privacy, terms, refund, about, contact, blog] = await Promise.all([
    getPageContent<PrivacyContent>('privacy'),
    getPageContent<TermsContent>('terms'),
    getPageContent<RefundContent>('refund'),
    getPageContent<AboutContent>('about'),
    getPageContent<ContactContent>('contact'),
    getPageContent<BlogContent>('blog'),
  ]);

  return (
    <PagesManagerClient
      initialPrivacy={privacy}
      initialTerms={terms}
      initialRefund={refund}
      initialAbout={about}
      initialContact={contact}
      initialBlog={blog}
    />
  );
}
