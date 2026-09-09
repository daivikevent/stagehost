import Link from 'next/link';
import { FileText, Clock, Mail, ChevronRight, Edit3 } from 'lucide-react';
import { getPageContent } from '@/lib/actions/pages';
import type { TermsContent } from '@/types/pages';
import styles from '@/components/marketing/PolicyPage.module.css';

export const metadata = {
  title: 'Terms of Service | StageHost',
  description: 'StageHost platform terms of service, anchor portfolio obligations, and booking facilitation disclaimers.',
};

export default async function TermsPage() {
  const content = await getPageContent<TermsContent>('terms');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={styles.badge}>
            <FileText size={14} /> Platform Agreement
          </div>
          <Link href="/admin/pages" className={styles.adminEditLink}>
            <Edit3 size={12} /> Edit in Admin CMS
          </Link>
        </div>

        <h1 className={styles.title}>{content.title}</h1>

        <div className={styles.metaBar}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> Last Revised: {content.lastUpdated}
          </span>
          <span>·</span>
          <span>Applicable to all Anchors &amp; Clients</span>
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
          <h4>Need clarification on terms or billing?</h4>
          <p>Our legal and operations desk is available Monday through Saturday.</p>
        </div>
        <Link href="/contact" className="btn btn-primary btn-md">
          <Mail size={16} /> Contact Legal Desk <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
