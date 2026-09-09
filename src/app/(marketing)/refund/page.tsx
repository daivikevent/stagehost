import Link from 'next/link';
import { RotateCcw, Clock, Mail, ChevronRight, Edit3 } from 'lucide-react';
import { getPageContent } from '@/lib/actions/pages';
import type { RefundContent } from '@/types/pages';
import styles from '@/components/marketing/PolicyPage.module.css';

export const metadata = {
  title: 'Refund & Cancellation Policy | StageHost',
  description: 'StageHost subscription refund guarantees, cancellation policies, and gig booking dispute disclaimers.',
};

export default async function RefundPage() {
  const content = await getPageContent<RefundContent>('refund');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={styles.badge}>
            <RotateCcw size={14} /> Fair &amp; Transparent Policy
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
          <span>7-Day Pro Subscription Guarantee</span>
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
          <h4>Request a refund on your Pro subscription?</h4>
          <p>Send an email with your registered email and invoice ID within 7 days.</p>
        </div>
        <Link href="/contact" className="btn btn-primary btn-md">
          <Mail size={16} /> Request Refund <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
