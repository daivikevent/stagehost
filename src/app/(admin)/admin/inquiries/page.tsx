import { Metadata } from 'next';
import { getContactInquiries, getContactInquiryStats } from '@/lib/actions/contact';
import { AdminInquiriesClient } from './AdminInquiriesClient';

export const metadata: Metadata = {
  title: 'Contact Queries & Support Tickets | Admin',
  description: 'Manage and reply to inquiries and support questions submitted via the public Contact Us page.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminInquiriesPage() {
  const [inquiries, stats] = await Promise.all([
    getContactInquiries(),
    getContactInquiryStats(),
  ]);

  return <AdminInquiriesClient initialInquiries={inquiries} stats={stats} />;
}
