'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  FileText,
  RotateCcw,
  Building,
  PhoneCall,
  BookOpen,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { updatePageContent } from '@/lib/actions/pages';
import type {
  PageKey,
  PrivacyContent,
  TermsContent,
  RefundContent,
  AboutContent,
  ContactContent,
  BlogContent,
  BlogArticle,
} from '@/types/pages';
import styles from './PagesManager.module.css';

interface PagesManagerProps {
  initialPrivacy: PrivacyContent;
  initialTerms: TermsContent;
  initialRefund: RefundContent;
  initialAbout: AboutContent;
  initialContact: ContactContent;
  initialBlog: BlogContent;
}

export function PagesManagerClient({
  initialPrivacy,
  initialTerms,
  initialRefund,
  initialAbout,
  initialContact,
  initialBlog,
}: PagesManagerProps) {
  const [activeTab, setActiveTab] = useState<PageKey>('privacy');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Individual page states
  const [privacy, setPrivacy] = useState<PrivacyContent>(initialPrivacy);
  const [terms, setTerms] = useState<TermsContent>(initialTerms);
  const [refund, setRefund] = useState<RefundContent>(initialRefund);
  const [about, setAbout] = useState<AboutContent>(initialAbout);
  const [contact, setContact] = useState<ContactContent>(initialContact);
  const [blog, setBlog] = useState<BlogContent>(initialBlog);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let payload: any;
      if (activeTab === 'privacy') payload = privacy;
      else if (activeTab === 'terms') payload = terms;
      else if (activeTab === 'refund') payload = refund;
      else if (activeTab === 'about') payload = about;
      else if (activeTab === 'contact') payload = contact;
      else if (activeTab === 'blog') payload = blog;

      await updatePageContent(activeTab, payload);
      setSuccessMessage(`${activeTab.toUpperCase()} page updated successfully! Live page has been refreshed.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Pages &amp; Legal Content CMS</h1>
          <p className={styles.headerDesc}>
            Manage and update company information, legal compliance policies, and public footer pages.
          </p>
        </div>

        <div className={styles.quickLinks}>
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginRight: 4 }}>Preview Live:</span>
          <Link href="/about" target="_blank" className={styles.quickLinkBtn}>
            About <ExternalLink size={11} />
          </Link>
          <Link href="/contact" target="_blank" className={styles.quickLinkBtn}>
            Contact <ExternalLink size={11} />
          </Link>
          <Link href="/privacy" target="_blank" className={styles.quickLinkBtn}>
            Privacy <ExternalLink size={11} />
          </Link>
          <Link href="/terms" target="_blank" className={styles.quickLinkBtn}>
            Terms <ExternalLink size={11} />
          </Link>
          <Link href="/refund" target="_blank" className={styles.quickLinkBtn}>
            Refund <ExternalLink size={11} />
          </Link>
          <Link href="/blog" target="_blank" className={styles.quickLinkBtn}>
            Blog <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabList}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'privacy' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <Shield size={16} /> Privacy Policy
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'terms' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          <FileText size={16} /> Terms of Service
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'refund' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('refund')}
        >
          <RotateCcw size={16} /> Refund Policy
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'about' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <Building size={16} /> About Us
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'contact' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <PhoneCall size={16} /> Contact &amp; Support
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'blog' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('blog')}
        >
          <BookOpen size={16} /> Blog &amp; Guides
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className={styles.alertSuccess}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className={styles.alertSuccess} style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab 1: Privacy Policy */}
      {activeTab === 'privacy' && (
        <div className={styles.editorCard}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Document Title</label>
              <input
                className={styles.input}
                value={privacy.title}
                onChange={(e) => setPrivacy({ ...privacy, title: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Updated Date / Month</label>
              <input
                className={styles.input}
                value={privacy.lastUpdated}
                onChange={(e) => setPrivacy({ ...privacy, lastUpdated: e.target.value })}
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Summary / Executive Overview</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={privacy.summary}
                onChange={(e) => setPrivacy({ ...privacy, summary: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.sectionManager}>
            <div className={styles.sectionManagerHeader}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Policy Sections ({privacy.sections.length})</h3>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  setPrivacy({
                    ...privacy,
                    sections: [
                      ...privacy.sections,
                      { title: `${privacy.sections.length + 1}. New Clause`, content: 'Enter clause details here.' },
                    ],
                  })
                }
              >
                <Plus size={14} /> Add Section
              </button>
            </div>

            {privacy.sections.map((sec, idx) => (
              <div key={idx} className={styles.sectionItem}>
                <div className={styles.sectionItemHeader}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>Section #{idx + 1}</span>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() =>
                      setPrivacy({
                        ...privacy,
                        sections: privacy.sections.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <input
                    className={styles.input}
                    placeholder="Section Title"
                    value={sec.title}
                    onChange={(e) => {
                      const updated = [...privacy.sections];
                      updated[idx].title = e.target.value;
                      setPrivacy({ ...privacy, sections: updated });
                    }}
                  />
                </div>
                <div>
                  <textarea
                    className={styles.textarea}
                    placeholder="Section Content"
                    rows={4}
                    value={sec.content}
                    onChange={(e) => {
                      const updated = [...privacy.sections];
                      updated[idx].content = e.target.value;
                      setPrivacy({ ...privacy, sections: updated });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Terms of Service */}
      {activeTab === 'terms' && (
        <div className={styles.editorCard}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Document Title</label>
              <input
                className={styles.input}
                value={terms.title}
                onChange={(e) => setTerms({ ...terms, title: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Revised Date / Month</label>
              <input
                className={styles.input}
                value={terms.lastUpdated}
                onChange={(e) => setTerms({ ...terms, lastUpdated: e.target.value })}
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Summary / Notice</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={terms.summary}
                onChange={(e) => setTerms({ ...terms, summary: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.sectionManager}>
            <div className={styles.sectionManagerHeader}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Terms Clauses ({terms.sections.length})</h3>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  setTerms({
                    ...terms,
                    sections: [
                      ...terms.sections,
                      { title: `${terms.sections.length + 1}. New Clause`, content: 'Enter clause details here.' },
                    ],
                  })
                }
              >
                <Plus size={14} /> Add Clause
              </button>
            </div>

            {terms.sections.map((sec, idx) => (
              <div key={idx} className={styles.sectionItem}>
                <div className={styles.sectionItemHeader}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>Clause #{idx + 1}</span>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() =>
                      setTerms({
                        ...terms,
                        sections: terms.sections.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <input
                    className={styles.input}
                    placeholder="Clause Title"
                    value={sec.title}
                    onChange={(e) => {
                      const updated = [...terms.sections];
                      updated[idx].title = e.target.value;
                      setTerms({ ...terms, sections: updated });
                    }}
                  />
                </div>
                <div>
                  <textarea
                    className={styles.textarea}
                    placeholder="Clause Content"
                    rows={4}
                    value={sec.content}
                    onChange={(e) => {
                      const updated = [...terms.sections];
                      updated[idx].content = e.target.value;
                      setTerms({ ...terms, sections: updated });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Refund Policy */}
      {activeTab === 'refund' && (
        <div className={styles.editorCard}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Document Title</label>
              <input
                className={styles.input}
                value={refund.title}
                onChange={(e) => setRefund({ ...refund, title: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Updated Date / Month</label>
              <input
                className={styles.input}
                value={refund.lastUpdated}
                onChange={(e) => setRefund({ ...refund, lastUpdated: e.target.value })}
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Summary / Refund Overview</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={refund.summary}
                onChange={(e) => setRefund({ ...refund, summary: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.sectionManager}>
            <div className={styles.sectionManagerHeader}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Policy Sections ({refund.sections.length})</h3>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  setRefund({
                    ...refund,
                    sections: [
                      ...refund.sections,
                      { title: `${refund.sections.length + 1}. Subscription Clause`, content: 'Enter refund policy terms here.' },
                    ],
                  })
                }
              >
                <Plus size={14} /> Add Section
              </button>
            </div>

            {refund.sections.map((sec, idx) => (
              <div key={idx} className={styles.sectionItem}>
                <div className={styles.sectionItemHeader}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>Section #{idx + 1}</span>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() =>
                      setRefund({
                        ...refund,
                        sections: refund.sections.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <input
                    className={styles.input}
                    placeholder="Section Title"
                    value={sec.title}
                    onChange={(e) => {
                      const updated = [...refund.sections];
                      updated[idx].title = e.target.value;
                      setRefund({ ...refund, sections: updated });
                    }}
                  />
                </div>
                <div>
                  <textarea
                    className={styles.textarea}
                    placeholder="Section Content"
                    rows={4}
                    value={sec.content}
                    onChange={(e) => {
                      const updated = [...refund.sections];
                      updated[idx].content = e.target.value;
                      setRefund({ ...refund, sections: updated });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: About Us */}
      {activeTab === 'about' && (
        <div className={styles.editorCard}>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Hero Headline</label>
              <input
                className={styles.input}
                value={about.headline}
                onChange={(e) => setAbout({ ...about, headline: e.target.value })}
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Hero Subtitle</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={about.subtitle}
                onChange={(e) => setAbout({ ...about, subtitle: e.target.value })}
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>StageHost Story &amp; Mission</label>
              <textarea
                className={styles.textarea}
                rows={5}
                value={about.story}
                onChange={(e) => setAbout({ ...about, story: e.target.value })}
              />
            </div>
          </div>

          {/* Key Stats */}
          <div className={styles.sectionManager}>
            <div className={styles.sectionManagerHeader}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Key Highlight Stats</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {about.stats.map((st, idx) => (
                <div key={idx} style={{ background: 'var(--color-bg-primary)', padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                  <label className={styles.label}>Stat #{idx + 1} Value</label>
                  <input
                    className={styles.input}
                    style={{ marginBottom: 8 }}
                    value={st.value}
                    onChange={(e) => {
                      const updated = [...about.stats];
                      updated[idx].value = e.target.value;
                      setAbout({ ...about, stats: updated });
                    }}
                  />
                  <label className={styles.label}>Label</label>
                  <input
                    className={styles.input}
                    value={st.label}
                    onChange={(e) => {
                      const updated = [...about.stats];
                      updated[idx].label = e.target.value;
                      setAbout({ ...about, stats: updated });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Core Values */}
          <div className={styles.sectionManager} style={{ marginTop: 24 }}>
            <div className={styles.sectionManagerHeader}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Core Principles ({about.values.length})</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {about.values.map((v, idx) => (
                <div key={idx} style={{ background: 'var(--color-bg-primary)', padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                  <label className={styles.label}>Principle Title</label>
                  <input
                    className={styles.input}
                    style={{ marginBottom: 8 }}
                    value={v.title}
                    onChange={(e) => {
                      const updated = [...about.values];
                      updated[idx].title = e.target.value;
                      setAbout({ ...about, values: updated });
                    }}
                  />
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={v.desc}
                    onChange={(e) => {
                      const updated = [...about.values];
                      updated[idx].desc = e.target.value;
                      setAbout({ ...about, values: updated });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Contact & Support */}
      {activeTab === 'contact' && (
        <div className={styles.editorCard}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Page Title</label>
              <input
                className={styles.input}
                value={contact.title}
                onChange={(e) => setContact({ ...contact, title: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Page Subtitle</label>
              <input
                className={styles.input}
                value={contact.subtitle}
                onChange={(e) => setContact({ ...contact, subtitle: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Official Support Email</label>
              <input
                type="email"
                className={styles.input}
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Official WhatsApp Number</label>
              <input
                className={styles.input}
                placeholder="+91 98765 43210"
                value={contact.whatsapp}
                onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Operating Hours</label>
              <input
                className={styles.input}
                value={contact.hours}
                onChange={(e) => setContact({ ...contact, hours: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Response Time Commitment</label>
              <input
                className={styles.input}
                value={contact.responseCommitment}
                onChange={(e) => setContact({ ...contact, responseCommitment: e.target.value })}
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Headquarters / Physical Office Address</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={contact.address}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Blog & Guides */}
      {activeTab === 'blog' && (
        <div className={styles.editorCard}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Blog Header Title</label>
              <input
                className={styles.input}
                value={blog.title}
                onChange={(e) => setBlog({ ...blog, title: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Blog Subtitle</label>
              <input
                className={styles.input}
                value={blog.subtitle}
                onChange={(e) => setBlog({ ...blog, subtitle: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.sectionManager}>
            <div className={styles.sectionManagerHeader}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Published Guides ({blog.articles.length})</h3>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  setBlog({
                    ...blog,
                    articles: [
                      {
                        id: Date.now().toString(),
                        title: 'New Anchor Career Guide',
                        slug: `guide-${Date.now()}`,
                        category: 'Career Growth',
                        readTime: '4 min read',
                        publishedAt: 'September 2026',
                        author: 'StageHost Editorial',
                        excerpt: 'Summary of the guide...',
                        content: 'Write the complete guide content here in markdown or clear text.',
                      },
                      ...blog.articles,
                    ],
                  })
                }
              >
                <Plus size={14} /> Add New Article
              </button>
            </div>

            {blog.articles.map((art, idx) => (
              <div key={art.id || idx} className={styles.sectionItem}>
                <div className={styles.sectionItemHeader}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)' }}>{art.category || 'Article'}</span>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() =>
                      setBlog({
                        ...blog,
                        articles: blog.articles.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    <Trash2 size={12} /> Remove Article
                  </button>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Article Title</label>
                    <input
                      className={styles.input}
                      value={art.title}
                      onChange={(e) => {
                        const updated = [...blog.articles];
                        updated[idx].title = e.target.value;
                        setBlog({ ...blog, articles: updated });
                      }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Category</label>
                    <input
                      className={styles.input}
                      value={art.category}
                      onChange={(e) => {
                        const updated = [...blog.articles];
                        updated[idx].category = e.target.value;
                        setBlog({ ...blog, articles: updated });
                      }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Read Time</label>
                    <input
                      className={styles.input}
                      value={art.readTime}
                      onChange={(e) => {
                        const updated = [...blog.articles];
                        updated[idx].readTime = e.target.value;
                        setBlog({ ...blog, articles: updated });
                      }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Author</label>
                    <input
                      className={styles.input}
                      value={art.author}
                      onChange={(e) => {
                        const updated = [...blog.articles];
                        updated[idx].author = e.target.value;
                        setBlog({ ...blog, articles: updated });
                      }}
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Short Excerpt (Grid Card Preview)</label>
                    <input
                      className={styles.input}
                      value={art.excerpt}
                      onChange={(e) => {
                        const updated = [...blog.articles];
                        updated[idx].excerpt = e.target.value;
                        setBlog({ ...blog, articles: updated });
                      }}
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Full Article Content</label>
                    <textarea
                      className={styles.textarea}
                      rows={5}
                      value={art.content}
                      onChange={(e) => {
                        const updated = [...blog.articles];
                        updated[idx].content = e.target.value;
                        setBlog({ ...blog, articles: updated });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating / Bottom Save Bar */}
      <div className={styles.actionBtnRow}>
        <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
          Saving updates will automatically synchronize live pages across the website.
        </span>
        <button
          type="button"
          disabled={isSaving}
          className="btn btn-accent btn-lg"
          onClick={handleSave}
        >
          {isSaving ? (
            'Saving to Database...'
          ) : (
            <>
              <Save size={18} /> Save {activeTab.toUpperCase()} Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
