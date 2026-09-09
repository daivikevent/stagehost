'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import type { ContactContent } from '@/types/pages';
import { submitContactInquiry } from '@/lib/actions/contact';
import styles from '@/components/marketing/ContactPage.module.css';

export function ContactClient({ content }: { content: ContactContent }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('General Support');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await submitContactInquiry({
        name,
        email,
        phone: phone || undefined,
        subject,
        message,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Contact submit error:', err);
      setErrorMessage(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanWaNumber = content.whatsapp.replace(/[^0-9]/g, '');

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className={styles.badge}>
            <Sparkles size={14} /> StageHost Support Desk
          </div>
          <Link href="/admin/pages" style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Edit3 size={12} /> Edit in Admin CMS
          </Link>
        </div>

        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.subtitle}>{content.subtitle}</p>
      </div>

      <div className={styles.grid}>
        {/* Support Channels */}
        <div className={styles.channelList}>
          {/* Email */}
          <a href={`mailto:${content.email}`} className={styles.channelCard}>
            <div className={styles.channelIcon}>
              <Mail size={22} />
            </div>
            <div className={styles.channelInfo}>
              <h4>Email Support</h4>
              <div className={styles.channelValue}>{content.email}</div>
              <div className={styles.channelDesc}>{content.responseCommitment}</div>
            </div>
          </a>

          {/* WhatsApp Direct */}
          <a
            href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent('Hi StageHost team! I need assistance with my anchor portfolio.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.channelCard}
          >
            <div className={styles.channelIcon} style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#25d366' }}>
              <MessageCircle size={22} />
            </div>
            <div className={styles.channelInfo}>
              <h4>WhatsApp Quick Chat</h4>
              <div className={styles.channelValue}>{content.whatsapp}</div>
              <div className={styles.channelDesc}>Instant response during working hours</div>
            </div>
          </a>

          {/* Working Hours */}
          <div className={styles.channelCard}>
            <div className={styles.channelIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Clock size={22} />
            </div>
            <div className={styles.channelInfo}>
              <h4>Hours of Operation</h4>
              <div className={styles.channelValue}>{content.hours}</div>
              <div className={styles.channelDesc}>Dedicated support for anchors across India</div>
            </div>
          </div>

          {/* Office Address */}
          <div className={styles.channelCard}>
            <div className={styles.channelIcon} style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
              <MapPin size={22} />
            </div>
            <div className={styles.channelInfo}>
              <h4>Headquarters</h4>
              <div className={styles.channelValue}>StageHost Technologies</div>
              <div className={styles.channelDesc}>{content.address}</div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className={styles.formCard}>
          {isSubmitted ? (
            <div className={styles.successBox}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 12px' }} />
              <h4>Message Received!</h4>
              <p>
                Thank you, <strong>{name}</strong>. Our support team has logged your inquiry and will reach out to{' '}
                <strong>{email}</strong> within 2 hours.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 16 }}
                onClick={() => {
                  setIsSubmitted(false);
                  setName('');
                  setEmail('');
                  setMessage('');
                }}
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 className={styles.formTitle}>Send us a Message</h3>
              <p className={styles.formSubtitle}>
                Whether you need technical support, billing queries, or custom domain assistance.
              </p>

              {errorMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Your Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="rahul@example.com"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>WhatsApp / Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Topic / Query</label>
                <select
                  className={styles.input}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="General Support">General Support &amp; Portfolio Setup</option>
                  <option value="Billing / Pro Upgrade">Billing, Invoicing &amp; Pro Plan</option>
                  <option value="Custom Domain Setup">Custom Domain Assistance</option>
                  <option value="Verification Badge">Verified Anchor Badge Request</option>
                  <option value="Partnership / Sponsorship">Partnership / Corporate Inquiries</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>How can we help?</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your question or issue in detail..."
                  className={styles.textarea}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-accent btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send size={18} /> Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
