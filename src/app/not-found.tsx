import Link from 'next/link';
import { Compass, Home, Mic, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15), rgba(10, 10, 15, 1) 70%), var(--color-bg-primary, #0a0a0f)',
        color: '#f8fafc',
        padding: '32px 20px',
        textAlign: 'center',
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      }}
    >
      {/* Glowing 404 Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          color: '#d4af37',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '20px',
        }}
      >
        <Mic size={14} /> Spotlight Offline · Error 404
      </div>

      <h1
        style={{
          fontSize: 'clamp(3rem, 8vw, 5.5rem)',
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 16px 0',
        }}
      >
        Page or Anchor Not Found
      </h1>

      <p
        style={{
          maxWidth: '520px',
          fontSize: '16px',
          lineHeight: 1.6,
          color: '#94a3b8',
          margin: '0 0 32px 0',
        }}
      >
        The artist portfolio slug may have changed, or the page you are looking for has taken a bow. Don't worry, the show must go on!
      </p>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Link
          href="/directory"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #d4af37 0%, #b8972e 100%)',
            color: '#000',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.25)',
            transition: 'transform 0.15s ease',
          }}
        >
          <Compass size={18} /> Discover Top Anchors <ArrowRight size={16} />
        </Link>

        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            fontWeight: 500,
            fontSize: '15px',
            textDecoration: 'none',
            transition: 'background 0.15s ease',
          }}
        >
          <Home size={18} /> Back to Home
        </Link>
      </div>

      {/* Footer Branding Note */}
      <div
        style={{
          marginTop: '60px',
          fontSize: '13px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        Are you an anchor? <Link href="/login" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 500 }}>Sign in to your dashboard</Link>
      </div>
    </div>
  );
}
