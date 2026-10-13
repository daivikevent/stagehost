import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ReviewFormClient } from './ReviewFormClient';

interface ReviewPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('anchor_profiles')
    .select('name, tagline, profile_photo_url')
    .eq('slug', slug.toLowerCase())
    .single();

  if (!profile) {
    return {
      title: 'Leave a Review | BookMyArtist',
    };
  }

  return {
    title: `Rate & Review ${profile.name} | BookMyArtist Verified Reviews`,
    description: `Share your event experience and rate ${profile.name}'s performance. Your feedback is verified and published directly to their official portfolio.`,
    openGraph: {
      title: `Rate & Review ${profile.name}`,
      description: `Leave verified event feedback for ${profile.name} on BookMyArtist.`,
      images: profile.profile_photo_url ? [{ url: profile.profile_photo_url }] : [],
    },
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  const adminClient = createAdminClient();

  const { data: profile, error } = await adminClient
    .from('anchor_profiles')
    .select('id, name, slug, tagline, city, profile_photo_url, artist_type')
    .eq('slug', slug.toLowerCase())
    .single();

  if (error || !profile) {
    notFound();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#f8fafc', padding: '40px 16px' }}>
      <ReviewFormClient profile={profile} />
    </div>
  );
}
