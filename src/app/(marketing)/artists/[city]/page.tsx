import { Metadata } from 'next';
import { getDirectoryAnchors } from '@/lib/actions/profile';
import { DirectoryClient, type DirectoryAnchor } from '../../directory/DirectoryClient';
import { MAJOR_CITIES } from '@/constants';

interface CityPageProps {
  params: Promise<{ city: string }>;
}

function formatCitySlug(slug: string): string {
  const clean = decodeURIComponent(slug).toLowerCase().trim();
  const matched = MAJOR_CITIES.find((c) => c.toLowerCase() === clean);
  if (matched) return matched;
  return clean
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const cityName = formatCitySlug(city);

  const title = `Top Verified Live Artists, Anchors, DJs & Singers in ${cityName} | BookMyArtist`;
  const description = `Discover and book top verified live anchors, emcees, club DJs, wedding singers, stand-up comedians, and live bands in ${cityName}. Check verified show dates, watch reels, and connect directly on WhatsApp with zero agency commissions.`;

  return {
    title,
    description,
    keywords: [
      `artists in ${cityName}`,
      `anchors in ${cityName}`,
      `djs in ${cityName}`,
      `wedding singer ${cityName}`,
      `event artists in ${cityName}`,
      `hire performers ${cityName}`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'BookMyArtist',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CityArtistsPage({ params }: CityPageProps) {
  const { city } = await params;
  const cityName = formatCitySlug(city);
  const anchors = await getDirectoryAnchors();

  // Filter anchors matching city (or if artist lists city in tour_cities)
  const filtered = (anchors as DirectoryAnchor[]).filter((a) => {
    if (!a.city) return true; // show all if few, or let client-side handle
    return a.city.toLowerCase() === cityName.toLowerCase();
  });

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Top Performing Artists & Anchors in ${cityName}`,
    description: `Verified directory of wedding and corporate artists in ${cityName}`,
    itemListElement: (filtered.length > 0 ? filtered : (anchors as DirectoryAnchor[]))
      .slice(0, 10)
      .map((a, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Person',
          name: a.name,
          url: `https://bookmyartist.in/${a.slug}`,
          jobTitle: a.tagline || 'Live Artist',
          address: {
            '@type': 'PostalAddress',
            addressLocality: cityName,
            addressCountry: 'IN',
          },
        },
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <DirectoryClient
        initialAnchors={anchors as DirectoryAnchor[]}
        initialCity={cityName}
        titleOverride={`Top Live Artists & Performers in ${cityName}`}
        subtitleOverride={`Book verified Anchors, DJs, Live Singers & Bands in ${cityName} for weddings, corporate galas & private celebrations.`}
      />
    </>
  );
}
