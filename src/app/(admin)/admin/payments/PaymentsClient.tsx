'use client';

import { useState } from 'react';
import { Search, Download, CreditCard, ArrowUpDown } from 'lucide-react';
import styles from '../dashboard/admin.module.css';

interface PaymentRecord {
  id: string;
  name: string;
  plan: string;
  amount: number;
  status: string;
  date: string;
}

interface PaymentsClientProps {
  initialPayments: PaymentRecord[];
}

function exportPaymentsToCSV(records: PaymentRecord[]) {
  const headers = ['Payment ID', 'Anchor Name', 'Plan Tier', 'Amount (INR)', 'Status', 'Date'];
  const rows = records.map((p) => [
    `"${p.id}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${p.plan}"`,
    p.amount,
    `"${p.status}"`,
    `"${p.date}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `stagehost_payments_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const [payments] = useState<PaymentRecord[]>(initialPayments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = payments.filter((p) => {
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.id.toLowerCase().includes(search.toLowerCase()) &&
      !p.plan.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (statusFilter && p.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleExport = () => {
    exportPaymentsToCSV(filtered);
  };

  return (
    <div className={styles.section}>
      <div className={styles.filtersRow} style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '320px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: '36px', width: '100%' }}
            placeholder="Search payment ID, anchor, plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input"
          style={{ width: '140px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleExport}
          title="Download payment ledger as CSV"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            <CreditCard size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div>No transaction records found matching your filters.</div>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Anchor</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="text-xs text-tertiary font-mono">{p.id}</td>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="badge badge-primary">{p.plan}</span></td>
                    <td><strong>₹{p.amount}</strong></td>
                    <td>
                      <span className={`badge badge-${p.status === 'success' ? 'success' : 'error'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-xs text-tertiary">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
