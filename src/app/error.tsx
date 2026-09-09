'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to monitoring
    console.error('Unhandled StageHost error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(239, 68, 68, 0.12), rgba(10, 10, 15, 1) 70%), var(--color-bg-primary, #0a0a0f)',
        color: '#f8fafc',
        padding: '32px 20px',
        textAlign: 'center',
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
        }}
      >
        <AlertTriangle size={14} /> Something went wrong
      </div>

      <h1
        style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 700,
          lineHeight: 1.15,
          color: '#f8fafc',
          margin: '0 0 16px 0',
        }}
      >
        Intermission on Stage
      </h1>

      <p
        style={{
          maxWidth: '480px',
          fontSize: '15px',
          lineHeight: 1.6,
          color: '#94a3b8',
          margin: '0 0 32px 0',
        }}
      >
        We encountered an unexpected technical glitch. Your data is completely safe. Please try refreshing or return to the main stage.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => reset()}
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
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.25)',
          }}
        >
          <RotateCcw size={18} /> Try Again
        </button>

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
          }}
        >
          <Home size={18} /> Return Home
        </Link>
      </div>

      {error?.digest && (
        <div style={{ marginTop: '40px', fontSize: '12px', color: '#475569' }}>
          Incident Reference: {error.digest}
        </div>
      )}
    </div>
  );
}
