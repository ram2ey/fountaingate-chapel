'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const DataExportCenter: React.FC = () => {
  const { members, contributions, careNotes } = useChurch();
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMembers = () => {
    setDownloading('members');
    setTimeout(() => {
      const headers = 'First Name,Last Name,Phone,Email,Cell Group,Status,Consecutive Absences,First Visited\n';
      const rows = members.map(m => 
        `"${m.first_name}","${m.last_name}","${m.phone}","${m.email || ''}","${m.cell_group}","${m.status}",${m.consecutive_absences},"${m.first_visited_at}"`
      ).join('\n');
      downloadCSV('FGC_Member_Directory_Backup.csv', headers + rows);
      setDownloading(null);
    }, 600);
  };

  const handleExportGiving = () => {
    setDownloading('giving');
    setTimeout(() => {
      const headers = 'Donor Name,Amount,Currency,Fund Type,Payment Method,Reference No,Date\n';
      const rows = contributions.map(c => 
        `"${c.donor_name}",${c.amount},"${c.currency}","${c.type}","${c.payment_method}","${c.reference_no || ''}","${c.giving_date}"`
      ).join('\n');
      downloadCSV('FGC_Financial_Giving_Ledger.csv', headers + rows);
      setDownloading(null);
    }, 600);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 bg-white">
      <div>
        <h4 className="font-display font-bold text-base text-slate-900">Data Export & Backup Center</h4>
        <p className="text-xs text-slate-500">1-Click CSV/JSON backups for church administration reporting</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <h5 className="font-bold text-slate-900">Member Directory Backup</h5>
          <p className="text-[11px] text-slate-500">Export all {members.length} registered member profiles, cell groups, and contact details to CSV.</p>
          <button
            onClick={handleExportMembers}
            disabled={downloading === 'members'}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-sm disabled:opacity-50"
          >
            {downloading === 'members' ? 'Generating Member CSV...' : 'Export Member Directory (.CSV)'}
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <h5 className="font-bold text-slate-900">Financial Ledger Export</h5>
          <p className="text-[11px] text-slate-500">Export all tithes, Sunday offerings, and fund transactions to CSV for accounting.</p>
          <button
            onClick={handleExportGiving}
            disabled={downloading === 'giving'}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm disabled:opacity-50"
          >
            {downloading === 'giving' ? 'Generating Financial CSV...' : 'Export Financial Ledger (.CSV)'}
          </button>
        </div>
      </div>
    </div>
  );
};
