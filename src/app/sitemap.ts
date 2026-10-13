import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { MAJOR_CITIES } from '@/constants';
import { ARTIST_CATEGORIES } from '@/constants/artists';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookmyartist.in';

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamic City & Category SEO Routes
  const topCities = MAJOR_CITIES.slice(0, 15);
  const cityRoutes: MetadataRoute.Sitemap = topCities.map((city) => ({
    url: `${baseUrl}/artists/${encodeURIComponent(city.toLowerCase())}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const catRoutes: MetadataRoute.Sitemap = [];
  for (const city of topCities) {
    for (const cat of ARTIST_CATEGORIES.slice(0, 8)) {
      catRoutes.push({
        url: `${baseUrl}/artists/${encodeURIComponent(city.toLowerCase())}/${cat.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  // Dynamic Anchor Profiles from Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: profiles } = await supabase
        .from('anchor_profiles')
        .select('slug, updated_at')
        .eq('is_listed_in_directory', true);

      if (profiles && profiles.length > 0) {
        const anchorRoutes: MetadataRoute.Sitemap = profiles.map((p) => ({
          url: `${baseUrl}/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.9,
        }));

    return [...staticRoutes, ...cityRoutes, ...catRoutes, ...anchorRoutes];
      }
    }
  } catch (e) {
    console.error('Error generating dynamic sitemap:', e);
  }

  return [...staticRoutes, ...cityRoutes, ...catRoutes];
}
