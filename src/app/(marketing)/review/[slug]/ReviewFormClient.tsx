'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, Sparkles, MessageSquareHeart, Calendar, User, Briefcase, Award } from 'lucide-react';
import { submitClientReview } from '@/lib/actions/testimonials';

interface ReviewFormClientProps {
  profile: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    city?: string | null;
    profile_photo_url?: string | null;
    artist_type?: string | null;
  };
}

export function ReviewFormClient({ profile }: ReviewFormClientProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [clientName, setClientName] = useState('');
  const [clientRole, setClientRole] = useState('');
  const [eventType, setEventType] = useState('Wedding Celebration');
  const [eventDate, setEventDate] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const ratingDescriptions: Record<number, string> = {
    5: '⭐⭐⭐⭐⭐ Exceptional & Energetic! Made our event unforgettable!',
    4: '⭐⭐⭐⭐ Great performance! Very professional and engaging.',
    3: '⭐⭐⭐ Good show, kept the audience entertained.',
    2: '⭐⭐ Decent, but room for improvement.',
    1: '⭐ Below expectations.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientName.trim()) {
      setErrorMsg('Please enter your name or company name.');
      return;
    }
    if (!text.trim() || text.trim().length < 8) {
      setErrorMsg('Please write a brief review of at least a few words.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitClientReview(profile.slug, {
        client_name: clientName,
        client_designation: clientRole || 'Event Host',
        text,
        rating,
        event_type: eventType,
        event_date: eventDate || null,
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.error || 'Failed to submit review');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: '580px', margin: '40px auto', textAlign: 'center', background: '#121220', borderRadius: '24px', padding: '48px 24px', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#10b981' }}>
          <CheckCircle2 size={42} />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Review Published!</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 28px' }}>
          Thank you, <strong style={{ color: '#fff' }}>{clientName}</strong>! Your 5-star verified testimonial is now proudly displayed on <strong style={{ color: '#6C5CE7' }}>{profile.name}</strong>&apos;s official live portfolio.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href={`/${profile.slug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              background: '#6C5CE7',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(108, 92, 231, 0.4)',
            }}
          >
            <Sparkles size={16} /> View {profile.name}&apos;s Live Portfolio
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setText('');
              setClientName('');
            }}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
            }}
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '16px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            Book<span style={{ color: '#6C5CE7' }}>My</span>Artist
          </span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(108, 92, 231, 0.2)', color: '#a5b4fc', border: '1px solid rgba(108, 92, 231, 0.4)' }}>
            Verified Review Loop
          </span>
        </Link>
      </div>

      {/* Artist Profile Card */}
      <div style={{ background: '#121220', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
        <div style={{ width: '68px', height: '68px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #6C5CE7', background: '#1e1b4b' }}>
          {profile.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.profile_photo_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 700, fontSize: '24px' }}>
              {profile.name[0]}
            </div>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>{profile.name}</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>
              <Award size={12} /> Verified Artist
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', margin: '4px 0 0' }}>
            {profile.tagline || 'Live Performer & Stage Artist'} {profile.city ? `· ${profile.city}` : ''}
          </p>
        </div>
      </div>

      {/* Review Form Card */}
      <form onSubmit={handleSubmit} style={{ background: '#121220', borderRadius: '24px', padding: '32px 28px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '12px' }}>
            Rate Your Stage Experience
          </label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    transition: 'transform 0.15s ease',
                    transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <Star
                    size={36}
                    fill={active ? '#F59E0B' : 'transparent'}
                    color={active ? '#F59E0B' : 'rgba(255, 255, 255, 0.25)'}
                  />
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600, minHeight: '18px' }}>
            {ratingDescriptions[hoverRating || rating]}
          </div>
        </div>

        {/* Input Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
              <User size={13} /> Your Name / Hosts *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rohit & Tanya"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
              <Briefcase size={13} /> Role / Company (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Wedding Host / Google India"
              value={clientRole}
              onChange={(e) => setClientRole(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#1a1a2e',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="Wedding Celebration">Wedding Celebration</option>
              <option value="Sangeet & Cocktail Night">Sangeet &amp; Cocktail Night</option>
              <option value="Corporate Summit / Gala">Corporate Summit / Gala</option>
              <option value="Club / DJ Night">Club / DJ Night</option>
              <option value="Private Birthday / Anniversary">Private Birthday / Anniversary</option>
              <option value="Concert / Music Festival">Concert / Music Festival</option>
              <option value="College Fest">College Fest</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
              <Calendar size={13} /> Event Date (Approx)
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
            <MessageSquareHeart size={13} /> Your Review / Feedback *
          </label>
          <textarea
            required
            rows={4}
            placeholder={`How was ${profile.name}'s performance? How was the audience reaction, crowd engagement, punctuality, and stage presence?`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              lineHeight: 1.6,
              resize: 'vertical',
            }}
          />
        </div>

        {errorMsg && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '13px' }}>
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6C5CE7 0%, #4f46e5 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '15px',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            boxShadow: '0 6px 25px rgba(108, 92, 231, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {submitting ? 'Submitting Review...' : 'Submit Verified Testimonial ★'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '16px', marginBottom: 0 }}>
          🔒 Reviews are cryptographically verified and attached to {profile.name}&apos;s verified public stage profile on BookMyArtist.
        </p>
      </form>
    </div>
  );
}
