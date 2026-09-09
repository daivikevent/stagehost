'use client';

import { useState, useTransition } from 'react';
import {
  Inbox,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  Archive,
  Trash2,
  Search,
  Tag,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import type { ContactSubmission } from '@/types';
import {
  updateContactInquiryStatus,
  deleteContactInquiry,
} from '@/lib/actions/contact';
import styles from './admin-inquiries.module.css';

interface AdminInquiriesClientProps {
  initialInquiries: ContactSubmission[];
  stats: {
    total: number;
    newCount: number;
    readCount: number;
    repliedCount: number;
    archivedCount: number;
  };
}

export function AdminInquiriesClient({
  initialInquiries,
  stats: initialStats,
}: AdminInquiriesClientProps) {
  const [inquiries, setInquiries] = useState<ContactSubmission[]>(initialInquiries);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const handleStatusChange = (
    id: string,
    newStatus: 'new' | 'read' | 'replied' | 'archived'
  ) => {
    setActionId(id);
    startTransition(async () => {
      try {
        await updateContactInquiryStatus(id, newStatus);
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      } catch (err) {
        console.error('Failed to update status:', err);
      } finally {
        setActionId(null);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this contact query? This cannot be undone.')) {
      return;
    }
    setActionId(id);
    startTransition(async () => {
      try {
        await deleteContactInquiry(id);
        setInquiries((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.error('Failed to delete query:', err);
      } finally {
        setActionId(null);
      }
    });
  };

  // Filter inquiries
  const filtered = inquiries.filter((item) => {
    if (activeTab !== 'all' && item.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.phone && item.phone.includes(q)) ||
        item.subject.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const newCount = inquiries.filter((i) => i.status === 'new').length;
  const readCount = inquiries.filter((i) => i.status === 'read').length;
  const repliedCount = inquiries.filter((i) => i.status === 'replied').length;
  const archivedCount = inquiries.filter((i) => i.status === 'archived').length;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Contact Queries &amp; Support</h1>
          <p className={styles.headerDesc}>
            Real-time inquiries and support questions submitted via the public Contact Us desk
          </p>
        </div>
        {newCount > 0 && (
          <div className="badge badge-accent" style={{ padding: '6px 14px', fontSize: '12px', gap: '6px' }}>
            <Sparkles size={14} /> {newCount} New Unread {newCount === 1 ? 'Query' : 'Queries'}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(108, 92, 231, 0.12)', color: 'var(--color-primary)' }}>
            <Inbox size={20} />
          </div>
          <div>
            <div className={styles.statNumber}>{inquiries.length}</div>
            <div className={styles.statLabel}>Total Inquiries</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(240, 165, 0, 0.12)', color: 'var(--color-accent)' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div className={styles.statNumber}>{newCount}</div>
            <div className={styles.statLabel}>Pending / New</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className={styles.statNumber}>{repliedCount}</div>
            <div className={styles.statLabel}>Replied &amp; Resolved</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-tertiary)' }}>
            <Archive size={20} />
          </div>
          <div>
            <div className={styles.statNumber}>{archivedCount}</div>
            <div className={styles.statLabel}>Archived</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={styles.filterBar}>
        <div className={styles.tabList}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All <span className={styles.tabBadge}>{inquiries.length}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'new' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('new')}
          >
            New <span className={styles.tabBadge}>{newCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'read' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('read')}
          >
            Under Review <span className={styles.tabBadge}>{readCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'replied' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('replied')}
          >
            Replied <span className={styles.tabBadge}>{repliedCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'archived' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('archived')}
          >
            Archived <span className={styles.tabBadge}>{archivedCount}</span>
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search name, email, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Inquiries Feed */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Inbox size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            No Contact Queries Found
          </h3>
          <p style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
            {searchQuery
              ? `No inquiries match "${searchQuery}". Try clearing your search.`
              : activeTab !== 'all'
              ? `No inquiries found under the "${activeTab}" status filter.`
              : 'Queries submitted via the public Contact Us page will automatically appear here in real-time.'}
          </p>
        </div>
      ) : (
        <div className={styles.inquiryList}>
          {filtered.map((item) => {
            const cleanPhone = (item.phone || '').replace(/\D/g, '');
            const waParam = cleanPhone
              ? cleanPhone.startsWith('91')
                ? cleanPhone
                : `91${cleanPhone}`
              : '';
            const waUrl = waParam
              ? `https://wa.me/${waParam}?text=${encodeURIComponent(
                  `Hi ${item.name}! This is the StageHost admin desk regarding your contact inquiry regarding "${item.subject}".`
                )}`
              : null;
            const mailtoUrl = `mailto:${item.email}?subject=${encodeURIComponent(
              `Re: [StageHost Support] ${item.subject}`
            )}&body=${encodeURIComponent(
              `Hi ${item.name},\n\nThank you for contacting StageHost. In response to your inquiry:\n\n"${item.message}"\n\n`
            )}`;

            const cardStatusClass =
              item.status === 'new'
                ? styles.inquiryCardNew
                : item.status === 'replied'
                ? styles.inquiryCardReplied
                : item.status === 'archived'
                ? styles.inquiryCardArchived
                : '';

            const initials = item.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'SH';

            const createdDate = new Date(item.created_at);
            const formattedDate = createdDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={item.id} className={`${styles.inquiryCard} ${cardStatusClass}`}>
                {/* Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.senderInfo}>
                    <div className={styles.senderAvatar}>{initials}</div>
                    <div>
                      <div className={styles.senderName}>
                        <span>{item.name}</span>
                        {item.status === 'new' && (
                          <span className="badge badge-accent" style={{ fontSize: '10px', padding: '2px 8px' }}>
                            New
                          </span>
                        )}
                        {item.status === 'replied' && (
                          <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px' }}>
                            Replied
                          </span>
                        )}
                        {item.status === 'archived' && (
                          <span className="badge badge-ghost" style={{ fontSize: '10px', padding: '2px 8px' }}>
                            Archived
                          </span>
                        )}
                      </div>
                      <div className={styles.senderMeta}>
                        <a href={`mailto:${item.email}`} className={styles.metaLink}>
                          <Mail size={12} />
                          <span>{item.email}</span>
                        </a>
                        {item.phone && (
                          <>
                            <span>·</span>
                            <a href={`tel:${item.phone}`} className={styles.metaLink}>
                              <Phone size={12} />
                              <span>{item.phone}</span>
                            </a>
                          </>
                        )}
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.statusGroup}>
                    {/* Delete button */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      title="Delete inquiry"
                      disabled={isPending && actionId === item.id}
                      onClick={() => handleDelete(item.id)}
                      style={{ color: 'var(--color-error)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Topic / Subject Badge */}
                <div>
                  <div className={styles.subjectBadge}>
                    <Tag size={11} /> {item.subject}
                  </div>
                </div>

                {/* Message Body */}
                <div className={styles.messageBox}>{item.message}</div>

                {/* Actions Toolbar */}
                <div className={styles.actionRow}>
                  {/* Reply via Email & WhatsApp */}
                  <div className={styles.replyButtons}>
                    <a
                      href={mailtoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-xs"
                      onClick={() => {
                        if (item.status === 'new') {
                          handleStatusChange(item.id, 'replied');
                        }
                      }}
                    >
                      <Mail size={13} />
                      <span>Reply via Email</span>
                    </a>

                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success btn-xs"
                        style={{ gap: '5px' }}
                        onClick={() => {
                          if (item.status === 'new') {
                            handleStatusChange(item.id, 'replied');
                          }
                        }}
                      >
                        <MessageCircle size={13} />
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className={styles.statusButtons}>
                    {item.status === 'new' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        disabled={isPending && actionId === item.id}
                        onClick={() => handleStatusChange(item.id, 'read')}
                      >
                        <Eye size={12} /> Mark Read
                      </button>
                    )}

                    {item.status !== 'replied' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        disabled={isPending && actionId === item.id}
                        onClick={() => handleStatusChange(item.id, 'replied')}
                      >
                        <CheckCircle2 size={12} /> Mark Replied
                      </button>
                    )}

                    {item.status !== 'archived' ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        disabled={isPending && actionId === item.id}
                        onClick={() => handleStatusChange(item.id, 'archived')}
                      >
                        <Archive size={12} /> Archive
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        disabled={isPending && actionId === item.id}
                        onClick={() => handleStatusChange(item.id, 'read')}
                      >
                        <RefreshCw size={12} /> Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
