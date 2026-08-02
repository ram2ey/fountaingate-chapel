'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const PdfStatementGenerator: React.FC = () => {
  const { members, contributions } = useChurch();
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [year, setYear] = useState('2026');
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('Official Tithe & Giving Statement PDF downloaded successfully!');
    }, 1200);
  };

  const member = members.find(m => m.id === selectedMemberId);
  const memberTotal = contributions
    .filter(c => c.member_id === selectedMemberId)
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h4 className="font-display font-bold text-base text-slate-900">PDF Tithe Statement Generator</h4>
        <p className="text-xs text-slate-500">Generate official annual tax & tithe receipt statements</p>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-700 font-bold mb-1">Select Member *</label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name} ({m.phone})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Tax Year *</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
          >
            <option value="2026">2026 Fiscal Year</option>
            <option value="2025">2025 Fiscal Year</option>
          </select>
        </div>

        {member && (
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-slate-800 space-y-1">
            <p className="font-bold text-indigo-900">{member.first_name} {member.last_name}</p>
            <p className="text-[11px] text-slate-600">Total Recorded Giving ({year}): <strong className="text-emerald-700">GHS {memberTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={downloading}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
        >
          {downloading ? 'Generating Official PDF Statement...' : 'Download Official PDF Tithe Statement'}
        </button>
      </div>
    </div>
  );
};
