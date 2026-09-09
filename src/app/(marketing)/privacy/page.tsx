import Link from 'next/link';
import { Shield, Clock, Mail, ChevronRight, Edit3 } from 'lucide-react';
import { getPageContent } from '@/lib/actions/pages';
import type { PrivacyContent } from '@/types/pages';
import styles from '@/components/marketing/PolicyPage.module.css';

export const metadata = {
  title: 'Privacy Policy | StageHost',
  description: 'Learn how StageHost collects, stores, and protects personal data and portfolio media across India.',
};

export default async function PrivacyPage() {
  const content = await getPageContent<PrivacyContent>('privacy');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={styles.badge}>
            <Shield size={14} /> Official Legal Document
          </div>
          <Link href="/admin/pages" className={styles.adminEditLink}>
            <Edit3 size={12} /> Edit in Admin CMS
          </Link>
        </div>

        <h1 className={styles.title}>{content.title}</h1>

        <div className={styles.metaBar}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> Last Updated: {content.lastUpdated}
          </span>
          <span>·</span>
          <span>Jurisdiction: Mumbai, India</span>
        </div>

        <div className={styles.summaryBox}>
          {content.summary}
        </div>
      </div>

      <div className={styles.sectionList}>
        {content.sections.map((section, idx) => (
          <div key={idx} className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <div className={styles.sectionContent}>{section.content}</div>
          </div>
        ))}
      </div>

      <div className={styles.helpCard}>
        <div className={styles.helpText}>
          <h4>Have privacy questions or data requests?</h4>
          <p>Contact our Data Protection and Grievance Officer for prompt assistance.</p>
        </div>
        <Link href="/contact" className="btn btn-primary btn-md">
          <Mail size={16} /> Contact Privacy Team <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
