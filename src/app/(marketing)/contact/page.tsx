import { getPageContent } from '@/lib/actions/pages';
import type { ContactContent } from '@/types/pages';
import { ContactClient } from './ContactClient';

export const metadata = {
  title: 'Contact Support & Inquiries | StageHost',
  description: 'Reach out to the StageHost team for customer support, portfolio guidance, and corporate partnership inquiries.',
};

export default async function ContactPage() {
  const content = await getPageContent<ContactContent>('contact');
  return <ContactClient content={content} />;
}
