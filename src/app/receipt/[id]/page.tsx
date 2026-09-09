import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ReceiptPublicClient } from './ReceiptPublicClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: booking } = await adminClient
    .from('bookings')
    .select('event_name, event_type, date, profile:anchor_profiles(name, slug, avatar_url)')
    .eq('id', id)
    .maybeSingle();

  if (!booking) {
    return {
      title: 'Booking Confirmation Slip | StageHost',
    };
  }

  const artistName = (booking.profile as any)?.name || 'Anchor';
  const showName = booking.event_name || booking.event_type || 'Show Event';
  const pageTitle = `Booking Confirmation & Token Slip — ${showName} | ${artistName}`;
  const pageDesc = `Official artist booking confirmation and slot lock slip for ${showName} on ${booking.date} with ${artistName}. Created with StageHost.`;

  return {
    title: pageTitle,
    description: pageDesc,
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      siteName: 'StageHost',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: pageDesc,
    },
  };
}

export default async function PublicReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: booking, error } = await adminClient
    .from('bookings')
    .select('*, profile:anchor_profiles(*)')
    .eq('id', id)
    .maybeSingle();

  if (error || !booking) {
    notFound();
  }

  const profile = (booking.profile as any) || {
    name: 'Anchor',
    slug: 'anchor',
    tagline: 'Celebrity Anchor & Emcee',
  };

  return <ReceiptPublicClient booking={booking} profile={profile} />;
}
