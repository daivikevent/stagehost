import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { AgreementClient } from './AgreementClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AgreementPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AgreementPageProps): Promise<Metadata> {
  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: booking } = await adminClient
    .from('bookings')
    .select('event_name, event_type, date, profile:anchor_profiles(name, slug, profile_photo_url)')
    .eq('id', id)
    .maybeSingle();

  if (!booking) {
    return {
      title: 'Digital Performance Agreement | BookMyArtist',
    };
  }

  const artistName = (booking.profile as any)?.name || 'Artist';
  const showName = booking.event_name || booking.event_type || 'Live Performance';

  return {
    title: `Digital Performance Agreement — ${artistName} & ${booking.date} | BookMyArtist E-Sign`,
    description: `Official digital performance engagement agreement for ${showName} on ${booking.date} with ${artistName}. Secure mobile finger e-signing powered by BookMyArtist.`,
    openGraph: {
      title: `Digital Performance Agreement — ${artistName}`,
      description: `Official performance engagement agreement with mobile digital e-sign.`,
      siteName: 'BookMyArtist',
      type: 'website',
    },
  };
}

export default async function PublicAgreementPage({ params }: AgreementPageProps) {
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
    name: 'Artist',
    slug: 'artist',
    tagline: 'Professional Live Artist',
  };

  return <AgreementClient booking={booking} profile={profile} />;
}
