import { ImageResponse } from 'next/og';
import { getPublicProfile } from '@/lib/actions/profile';
import { DEMO_PROFILES } from '@/lib/demo-data';

export const alt = 'StageHost Artist Portfolio';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = (await getPublicProfile(slug)) || DEMO_PROFILES[slug];

  const name = profile?.name || 'StageHost Artist';
  const tagline = profile?.tagline || 'Professional Event Emcee & Anchor';
  const city = profile?.city ? `${profile.city}, India` : 'Available Pan-India';
  const events = profile?.event_types?.slice(0, 3).join(' · ') || 'Weddings · Corporate · Live Shows';
  const photoUrl = profile?.profile_photo_url;
  const initial = (name[0] || 'S').toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#080811',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(108, 92, 231, 0.25) 0%, rgba(8, 8, 17, 1) 65%), radial-gradient(circle at 10% 90%, rgba(232, 67, 147, 0.15) 0%, rgba(8, 8, 17, 1) 50%)',
          color: '#ffffff',
          padding: '60px 70px',
          fontFamily: 'sans-serif',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            maxWidth: '680px',
          }}
        >
          {/* Top Brand Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                backgroundColor: 'rgba(108, 92, 231, 0.25)',
                border: '1px solid rgba(108, 92, 231, 0.6)',
                borderRadius: '999px',
                padding: '6px 16px',
                color: '#a29bfe',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>✦</span> STAGEHOST VERIFIED ANCHOR
            </div>
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '999px',
                padding: '6px 14px',
                color: '#fbbf24',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              ★ 5.0 Star Rated
            </div>
          </div>

          {/* Center Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
            <div
              style={{
                fontSize: '56px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 500,
                color: '#cbd5e1',
                lineHeight: 1.3,
              }}
            >
              {tagline}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '18px',
                  color: '#94a3b8',
                  gap: '6px',
                }}
              >
                <span>📍</span> {city}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '18px',
                  color: '#94a3b8',
                  gap: '6px',
                }}
              >
                <span>🎤</span> {events}
              </div>
            </div>
          </div>

          {/* Bottom Link Watermark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: '#6C5CE7', fontWeight: 700 }}>
              stagehost.in/{slug}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Instant Booking & Live Availability
            </div>
          </div>
        </div>

        {/* Right Avatar Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              style={{
                width: '320px',
                height: '320px',
                borderRadius: '32px',
                objectFit: 'cover',
                border: '4px solid rgba(108, 92, 231, 0.6)',
                boxShadow: '0 25px 50px -12px rgba(108, 92, 231, 0.4)',
              }}
            />
          ) : (
            <div
              style={{
                width: '280px',
                height: '280px',
                borderRadius: '32px',
                background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '110px',
                fontWeight: 900,
                color: '#ffffff',
                border: '4px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(108, 92, 231, 0.5)',
              }}
            >
              {initial}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
