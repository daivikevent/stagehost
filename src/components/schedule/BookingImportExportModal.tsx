'use client';

import { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  Calendar,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { importBookingsBulk, type BookingRecord } from '@/lib/actions/schedule';
import { useToast } from '@/hooks/useToast';

interface BookingImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRecord[];
  anchorCity?: string;
  onSuccessReload?: () => void;
}

export function BookingImportExportModal({
  isOpen,
  onClose,
  bookings,
  anchorCity = '',
  onSuccessReload,
}: BookingImportExportModalProps) {
  const { success, error: showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  // 1. Export Bookings to CSV
  const handleExportCSV = (scope: 'all' | 'upcoming') => {
    const today = new Date().toISOString().split('T')[0];
    const targetBookings = scope === 'upcoming'
      ? bookings.filter((b) => b.date >= today)
      : bookings;

    if (targetBookings.length === 0) {
      showError('No bookings found to export');
      return;
    }

    const headers = [
      'Date (YYYY-MM-DD)',
      'Slot (morning/evening/full_day)',
      'Status (confirmed/tentative)',
      'Event Name',
      'Event Type',
      'City',
      'Venue',
      'Client Name',
      'Client Phone',
      'Client Email',
      'Amount (INR)',
      'Event Time',
      'Notes',
    ];

    const rows = targetBookings.map((b) => {
      const isHold = b.booking_status === 'tentative';
      const status = isHold ? 'tentative' : 'confirmed';
      const cleanNotes = (b.notes || '').replace(/\[PENCIL_HOLD\]\n?/g, '').replace(/\[TIME:.*?\]\n?/g, '').trim();

      const escapeCSV = (val: any) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      return [
        escapeCSV(b.date),
        escapeCSV(b.slot_type),
        escapeCSV(status),
        escapeCSV(b.event_name || ''),
        escapeCSV(b.event_type || ''),
        escapeCSV(b.city || ''),
        escapeCSV(b.venue || ''),
        escapeCSV(b.client_name || ''),
        escapeCSV(b.client_phone || ''),
        escapeCSV(b.client_email || ''),
        escapeCSV(b.amount || ''),
        escapeCSV(b.event_time || ''),
        escapeCSV(cleanNotes),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stagehost_bookings_${scope}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success(`Exported ${targetBookings.length} booking(s) successfully!`);
  };

  // 2. Download Sample Template CSV
  const handleDownloadSample = () => {
    const today = new Date();
    const date1 = today.toISOString().split('T')[0];
    const date2 = new Date(today.setDate(today.getDate() + 5)).toISOString().split('T')[0];

    const sample = `Date (YYYY-MM-DD),Slot (morning/evening/full_day),Status (confirmed/tentative),Event Name,Event Type,City,Venue,Client Name,Client Phone,Client Email,Amount (INR),Event Time,Notes
${date1},evening,confirmed,Sharma Wedding Sangeet,Wedding,Surat,The Grand Bhagwati,Rajesh Sharma,9820155667,rajesh@gmail.com,65000,7:00 PM - 11:30 PM,Bride family entry hosting
${date2},full_day,tentative,Corporate Annual Gala,Corporate,Mumbai,Grand Hyatt,Mehta Events,9876543210,contact@mehtaevents.com,50000,Full Day,Holding date for client confirmation`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stagehost_bookings_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Parse CSV content (supports with headers or raw data lines)
  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Simple regex CSV line parser
    const parseLine = (line: string) => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const firstLineCols = parseLine(lines[0]);
    // Check if line 0 looks like a date (e.g. 2026-10-15 or 15/10/2026) instead of header titles
    const isFirstLineData = /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(firstLineCols[0] || '');

    let startIndex = 1;
    let dateIdx = 0;
    let slotIdx = 1;
    let statusIdx = 2;
    let nameIdx = 3;
    let eventTypeIdx = 4;
    let cityIdx = 5;
    let venueIdx = 6;
    let clientNameIdx = 7;
    let clientPhoneIdx = 8;
    let clientEmailIdx = 9;
    let amountIdx = 10;
    let timeIdx = 11;
    let notesIdx = 12;

    if (!isFirstLineData && lines.length > 1) {
      const header = firstLineCols.map((h) => h.toLowerCase());
      const findIndex = (keys: string[]) => {
        return header.findIndex((h) => keys.some((k) => h.includes(k)));
      };

      dateIdx = findIndex(['date']);
      slotIdx = findIndex(['slot', 'time']);
      statusIdx = findIndex(['status', 'hold', 'type']);
      nameIdx = findIndex(['event name', 'show', 'title', 'event']);
      eventTypeIdx = findIndex(['event type', 'category']);
      cityIdx = findIndex(['city', 'location']);
      venueIdx = findIndex(['venue', 'hotel', 'hall']);
      clientNameIdx = findIndex(['client name', 'client', 'contact person']);
      clientPhoneIdx = findIndex(['client phone', 'phone', 'mobile', 'whatsapp']);
      clientEmailIdx = findIndex(['email', 'mail']);
      amountIdx = findIndex(['amount', 'price', 'fee', 'commercial', 'inr']);
      timeIdx = findIndex(['timing', 'event time', 'hours']);
      notesIdx = findIndex(['notes', 'remark', 'details']);
      startIndex = 1;
    } else {
      startIndex = 0;
    }

    const rows: any[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length === 0) continue;
      const date = cols[dateIdx !== -1 ? dateIdx : 0] || cols[0] || '';
      if (!date) continue;

      const slot = slotIdx !== -1 && cols[slotIdx] ? cols[slotIdx] : 'full_day';
      const status = statusIdx !== -1 && cols[statusIdx] ? cols[statusIdx] : 'confirmed';
      const eventName = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : 'Event Show';
      const eventType = eventTypeIdx !== -1 && cols[eventTypeIdx] ? cols[eventTypeIdx] : 'Wedding';
      const city = cityIdx !== -1 && cols[cityIdx] ? cols[cityIdx] : anchorCity;
      const venue = venueIdx !== -1 && cols[venueIdx] ? cols[venueIdx] : '';
      const clientName = clientNameIdx !== -1 && cols[clientNameIdx] ? cols[clientNameIdx] : '';
      const clientPhone = clientPhoneIdx !== -1 && cols[clientPhoneIdx] ? cols[clientPhoneIdx] : '';
      const clientEmail = clientEmailIdx !== -1 && cols[clientEmailIdx] ? cols[clientEmailIdx] : '';
      const amount = amountIdx !== -1 && cols[amountIdx] ? cols[amountIdx] : '';
      const eventTime = timeIdx !== -1 && cols[timeIdx] ? cols[timeIdx] : '';
      const notes = notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx] : '';

      rows.push({
        date,
        slot_type: slot,
        booking_status: status.toLowerCase().includes('hold') || status.toLowerCase().includes('tent') ? 'tentative' : 'confirmed',
        event_name: eventName,
        event_type: eventType,
        city,
        venue,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        amount,
        event_time: eventTime,
        notes,
      });
    }

    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      const parsed = parseCSV(content);
      setParsedRows(parsed);
      setImportResult(null);
      if (parsed.length === 0) {
        showError('Could not find any valid rows in CSV. Please verify column format.');
      } else {
        success(`Parsed ${parsed.length} booking rows ready for review!`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      showError('Please upload or paste CSV data first');
      return;
    }

    setIsImporting(true);
    try {
      const res = await importBookingsBulk(parsedRows);
      if (res.success) {
        setImportResult({
          successCount: res.importedCount,
          errors: res.errors || [],
        });
        success(`Successfully imported ${res.importedCount} bookings into your tour calendar!`);
        if (onSuccessReload) {
          setTimeout(() => {
            onSuccessReload();
          }, 800);
        }
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(108, 92, 231, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Import & Export Bookings
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                Transfer show schedules, Excel sheets & calendar data in 1 click
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '8px 24px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: activeTab === 'export' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'export' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={15} /> Export to Excel/CSV ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: activeTab === 'import' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'import' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={15} /> Bulk Import Existing Shows
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'export' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'rgba(108, 92, 231, 0.06)',
                  border: '1px solid rgba(108, 92, 231, 0.2)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <Sparkles size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Download All Booking Details
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    Export your complete tour sheet with show dates, client names, contact numbers, venues, amounts, and pencil holds directly to CSV for Microsoft Excel, Google Sheets, or backup.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Calendar size={16} color="var(--color-primary)" />
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Upcoming Shows</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                      Exports shows scheduled from today onward. Ideal for sharing with your manager or team.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('upcoming')}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Download Upcoming CSV
                  </button>
                </div>

                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <FileSpreadsheet size={16} color="var(--color-accent)" />
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Complete History</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                      Exports all shows ({bookings.length} total) past and future for accounting & records.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('all')}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Download All ({bookings.length})
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Info & Template Banner */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} color="#10B981" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Need the standard CSV format template?
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Fill dates, client names, and venues in Excel, then upload below.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="btn btn-ghost btn-xs"
                  style={{
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    padding: '6px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '8px',
                  }}
                >
                  <Download size={12} /> Download Sample CSV
                </button>
              </div>

              {/* Upload Dropzone */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: '16px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.background = 'rgba(108, 92, 231, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                <Upload size={32} color="var(--color-primary)" style={{ margin: '0 auto 10px auto' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Click to select or drag & drop CSV file
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  Supports CSV exported from Excel, Google Sheets, or Notion
                </div>
              </div>

              {/* Quick Paste CSV Option */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Or paste CSV rows directly
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>

              <div>
                <textarea
                  rows={2}
                  value={csvText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCsvText(val);
                    if (val.trim()) {
                      const parsed = parseCSV(val);
                      setParsedRows(parsed);
                    } else {
                      setParsedRows([]);
                    }
                  }}
                  placeholder="Paste CSV rows here (e.g. 2026-10-15, evening, confirmed, Destination Sangeet, Jaipur, Fairmont, Mr. Sharma, 9876543210, 75000)"
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Preview parsed rows */}
              {parsedRows.length > 0 && (
                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '14px',
                    border: '1px solid var(--color-border)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--color-success)" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {parsedRows.length} Shows detected in file
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setParsedRows([]);
                        setCsvText('');
                        setImportResult(null);
                      }}
                      className="btn btn-ghost btn-xs text-error"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Scrollable list preview */}
                  <div
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '12px',
                    }}
                  >
                    {parsedRows.slice(0, 10).map((r, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.date}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>•</span>
                          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{r.event_name}</span>
                          {r.city && <span style={{ color: 'var(--color-text-tertiary)' }}>({r.city})</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: r.booking_status === 'tentative' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: r.booking_status === 'tentative' ? '#F59E0B' : '#10B981',
                            }}
                          >
                            {r.booking_status === 'tentative' ? 'Hold' : 'Confirmed'}
                          </span>
                          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>{r.slot_type}</span>
                        </div>
                      </div>
                    ))}
                    {parsedRows.length > 10 && (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '11px', padding: '4px 0' }}>
                        + {parsedRows.length - 10} more rows ready for import
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isImporting}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: '8px', fontWeight: 700, padding: '10px' }}
                  >
                    {isImporting ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                    {isImporting ? 'Importing Bookings into Calendar...' : `Import ${parsedRows.length} Bookings to StageHost`}
                  </button>
                </div>
              )}

              {/* Import Result Notification */}
              {importResult && (
                <div
                  style={{
                    background: importResult.errors.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: importResult.errors.length > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="#10B981" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Successfully saved {importResult.successCount} shows into your schedule!
                    </span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px' }}>
                      <strong>Skipped rows with issues:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            <HelpCircle size={14} />
            <span>Dates automatically sync with your live public portfolio</span>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
