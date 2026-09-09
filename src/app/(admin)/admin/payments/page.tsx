import { IndianRupee, TrendingUp, ArrowUpRight } from 'lucide-react';
import { getAdminPayments, getAdminStats } from '@/lib/actions/admin';
import { formatINR } from '@/lib/utils';
import { PaymentsClient } from './PaymentsClient';
import styles from '../dashboard/admin.module.css';

export default async function AdminPaymentsPage() {
  const [payments, stats] = await Promise.all([
    getAdminPayments(),
    getAdminStats(),
  ]);

  const totalRevenue = payments
    .filter(p => p.status === 'success')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const successfulCount = payments.filter(p => p.status === 'success').length;
  const failedCount = payments.filter(p => p.status === 'failed').length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Payments & Revenue</h1>
          <p className={styles.pageSubtitle}>Live transaction log and platform revenue tracking</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Total Revenue</span>
            <IndianRupee size={18} color="var(--color-success)" />
          </div>
          <div className="stat-value">{formatINR(totalRevenue)}</div>
          <div className="stat-change stat-change-up"><TrendingUp size={12} /> Captured payments</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Monthly MRR</span>
            <ArrowUpRight size={18} color="var(--color-primary)" />
          </div>
          <div className="stat-value">{formatINR(stats.mrr)}</div>
          <div className="stat-change stat-change-up">Active Recurring</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Successful Transactions</span>
            <IndianRupee size={18} color="var(--color-accent)" />
          </div>
          <div className="stat-value">{successfulCount}</div>
          <div className="stat-change">Completed</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Failed Transactions</span>
            <IndianRupee size={18} color="var(--color-error)" />
          </div>
          <div className="stat-value">{failedCount}</div>
          <div className="stat-change">{failedCount === 0 ? 'All clear' : 'Action needed'}</div>
        </div>
      </div>

      <PaymentsClient initialPayments={payments} />
    </div>
  );
}

