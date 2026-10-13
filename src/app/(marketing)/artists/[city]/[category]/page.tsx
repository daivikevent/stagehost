import { Metadata } from 'next';
import { getDirectoryAnchors } from '@/lib/actions/profile';
import { DirectoryClient, type DirectoryAnchor } from '../../../directory/DirectoryClient';
import { MAJOR_CITIES, ARTIST_CATEGORIES, getArtistCategory } from '@/constants';

interface CategoryCityPageProps {
  params: Promise<{ city: string; category: string }>;
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

export async function generateMetadata({ params }: CategoryCityPageProps): Promise<Metadata> {
  const { city, category } = await params;
  const cityName = formatCitySlug(city);
  const cat = getArtistCategory(category);
  const craftName = cat ? cat.label : 'Performing Artists';

  const title = `Best ${craftName} in ${cityName} (2026) — Rates, Videos & Direct Booking | BookMyArtist`;
  const description = `Hire top verified ${craftName} in ${cityName}. Browse stage videos, live performance showreels, verified charges, and connect directly on WhatsApp with zero agency commissions.`;

  return {
    title,
    description,
    keywords: [
      `${cat?.shortLabel || 'artist'} in ${cityName}`,
      `best ${cat?.shortLabel || 'artist'} ${cityName}`,
      `wedding ${cat?.shortLabel || 'artist'} in ${cityName}`,
      `corporate ${cat?.shortLabel || 'artist'} ${cityName}`,
      `hire ${cat?.shortLabel || 'artist'} ${cityName}`,
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

export default async function CategoryCityPage({ params }: CategoryCityPageProps) {
  const { city, category } = await params;
  const cityName = formatCitySlug(city);
  const cat = getArtistCategory(category);
  const craftTitle = cat ? cat.label : 'Artists';
  const anchors = await getDirectoryAnchors();

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How do I book a verified ${craftTitle} in ${cityName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You can browse portfolios on BookMyArtist, check live calendar availability, watch stage videos, and click the direct WhatsApp button to chat and lock dates directly with the artist without any agency commissions.`,
        },
      },
      {
        '@type': 'Question',
        name: `What are the average charges for a ${craftTitle} in ${cityName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Rates typically vary based on event scale, city travel, and duration. Professional artists in ${cityName} list their starting rates on their BookMyArtist verified profile card.`,
        },
      },
      {
        '@type': 'Question',
        name: `Do artists in ${cityName} travel for destination weddings?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, most verified artists on BookMyArtist have active tour routing hubs and regularly travel across India and internationally for destination weddings and corporate galas.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <DirectoryClient
        initialAnchors={anchors as DirectoryAnchor[]}
        initialCity={cityName}
        initialArtistType={category.toLowerCase()}
        titleOverride={`Best ${craftTitle} in ${cityName}`}
        subtitleOverride={`Verified ${cat ? cat.shortLabel : 'Artists'} in ${cityName} with live showreels, calendar availability, and direct WhatsApp contact.`}
      />
    </>
  );
}
