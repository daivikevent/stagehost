'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Clock, ArrowRight, X, BookOpen, Edit3, User } from 'lucide-react';
import type { BlogContent, BlogArticle } from '@/types/pages';
import styles from '@/components/marketing/BlogPage.module.css';

export function BlogClient({ content }: { content: BlogContent }) {
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className={styles.badge}>
            <Sparkles size={14} /> StageHost Editorial
          </div>
          <Link href="/admin/pages" style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Edit3 size={12} /> Edit in Admin CMS
          </Link>
        </div>

        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.subtitle}>{content.subtitle}</p>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {content.articles.map((art) => (
          <div
            key={art.id}
            className={styles.articleCard}
            onClick={() => setSelectedArticle(art)}
          >
            <div>
              <div className={styles.cardTop}>
                <span className={styles.category}>{art.category}</span>
                <span className={styles.readTime}>
                  <Clock size={12} /> {art.readTime}
                </span>
              </div>
              <h3 className={styles.articleTitle}>{art.title}</h3>
              <p className={styles.excerpt}>{art.excerpt}</p>
            </div>

            <div className={styles.cardFooter}>
              <span>{art.publishedAt}</span>
              <span className={styles.readMore}>
                Read Guide <ArrowRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Article Modal */}
      {selectedArticle && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedArticle(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setSelectedArticle(null)}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className={styles.category}>{selectedArticle.category}</span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>·</span>
              <span className={styles.readTime}>
                <Clock size={12} /> {selectedArticle.readTime}
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2, marginBottom: 12 }}>
              {selectedArticle.title}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-tertiary)', fontSize: 13, borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
              <User size={14} /> {selectedArticle.author} · Published {selectedArticle.publishedAt}
            </div>

            <div className={styles.articleBody}>
              {selectedArticle.content}
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedArticle(null)}
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
