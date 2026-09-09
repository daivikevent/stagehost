'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Check, ArrowRight, ShieldCheck, Crown, Edit3 } from 'lucide-react';
import type { PublicPlan } from '@/lib/actions/plans';
import styles from '@/components/marketing/AboutPage.module.css';

interface PricingClientProps {
  plans: PublicPlan[];
}

export function PricingClient({ plans }: PricingClientProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className={styles.badge}>
            <Sparkles size={14} /> 100% Commission-Free
          </div>
          <Link
            href="/admin/plans"
            style={{
              fontSize: 12,
              color: 'var(--color-text-tertiary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit3 size={12} /> Edit in Admin Panel
          </Link>
        </div>

        <h1 className={styles.headline}>
          Simple, Honest Plans for <span className={styles.headlineGradient}>Every Stage</span>
        </h1>
        <p className={styles.subtitle}>
          Keep 100% of your performance fees. No hidden cuts, no middleman markups.
        </p>

        {/* Monthly / Annual Billing Toggle */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--color-bg-secondary)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            marginTop: 24,
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setBillingPeriod('monthly')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: billingPeriod === 'monthly' ? 'var(--color-primary)' : 'transparent',
              color: billingPeriod === 'monthly' ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod('yearly')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: billingPeriod === 'yearly' ? 'var(--color-primary)' : 'transparent',
              color: billingPeriod === 'yearly' ? '#fff' : 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Annual Billing
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(240, 165, 0, 0.2)',
                color: '#f0a500',
                fontWeight: 700,
              }}
            >
              SAVE 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 64,
          alignItems: 'stretch',
        }}
      >
        {plans.map((plan) => {
          const displayPrice = billingPeriod === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12);
          const isFree = plan.price_monthly === 0;

          return (
            <div
              key={plan.id}
              style={{
                background: 'var(--color-bg-secondary)',
                border: plan.popular
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-2xl)',
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: plan.popular ? '0 10px 30px rgba(240, 165, 0, 0.15)' : 'none',
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--gradient-accent)',
                    color: '#000',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '4px 14px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  Most Popular
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {plan.name}
                  </h3>
                  {plan.slug === 'premium' && <Crown size={16} color="var(--color-warning)" />}
                </div>

                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, minHeight: 38, margin: '0 0 16px 0' }}>
                  {plan.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  {plan.strike_price && plan.strike_price > displayPrice && (
                    <span
                      style={{
                        textDecoration: 'line-through',
                        color: 'var(--color-text-tertiary)',
                        fontSize: '20px',
                        fontWeight: 600,
                      }}
                    >
                      ₹{plan.strike_price}
                    </span>
                  )}
                  <span style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    {isFree ? 'Free' : `₹${displayPrice}`}
                  </span>
                  {!isFree && (
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                      {plan.period_text || (billingPeriod === 'monthly' ? '/month' : '/mo billed annually')}
                    </span>
                  )}
                  {isFree && (
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                      {plan.period_text || 'forever'}
                    </span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                    What&apos;s Included:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map((feat, fi) => (
                      <li key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        <Check size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                href={plan.href}
                className={plan.popular ? 'btn btn-accent btn-lg' : 'btn btn-secondary btn-lg'}
                style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
              >
                {plan.cta} <ArrowRight size={18} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Trust Callout */}
      <div className={styles.cta} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Have questions about custom agency plans?
          </h3>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            We work with talent agencies and artist management networks across India.
          </p>
        </div>
        <Link href="/contact" className="btn btn-primary btn-lg">
          Talk to Support
        </Link>
      </div>
    </div>
  );
}
