'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { getAllInquiriesForExport } from '@/lib/actions/admin';
import { useToast } from '@/hooks/useToast';

export function ExportLeadsButton() {
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const inquiries = await getAllInquiriesForExport();
      if (!inquiries.length) {
        showError('No inquiries found to export');
        return;
      }

      const headers = ['Inquiry ID', 'Client Name', 'Email', 'Phone', 'Event Type', 'Event Date', 'City', 'Budget Range', 'Status', 'Date'];
      const rows = inquiries.map((i) => [
        `"${i.id}"`,
        `"${(i.name || '').replace(/"/g, '""')}"`,
        `"${(i.email || '').replace(/"/g, '""')}"`,
        `"${(i.phone || '').replace(/"/g, '""')}"`,
        `"${(i.event_type || '').replace(/"/g, '""')}"`,
        `"${i.event_date || ''}"`,
        `"${(i.event_city || '').replace(/"/g, '""')}"`,
        `"${(i.budget_range || '').replace(/"/g, '""')}"`,
        `"${i.status}"`,
        `"${i.created_at}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `stagehost_leads_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      success(`Exported ${inquiries.length} leads to CSV!`);
    } catch {
      showError('Failed to export leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={handleExport}
      disabled={loading}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      {loading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
      Export Leads (CSV)
    </button>
  );
}
