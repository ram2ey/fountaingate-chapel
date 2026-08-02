'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const GivingLedgerTable: React.FC = () => {
  const { contributions, members } = useChurch();

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">Financial Tithe & Giving Ledger</h4>
          <p className="text-xs text-slate-500">Record of tithes, Sunday offerings, building fund seeds, and online payments</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200">
          Admin Audit View
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3 pl-4">Donor Name</th>
              <th className="p-3">Amount & Currency</th>
              <th className="p-3">Fund Category</th>
              <th className="p-3">Payment Method</th>
              <th className="p-3">Ref No</th>
              <th className="p-3 text-right pr-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {contributions.map((c) => {
              const member = members.find(m => m.id === c.member_id);
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 pl-4 font-bold text-slate-900">
                    {c.donor_name || (member ? `${member.first_name} ${member.last_name}` : 'Anonymous Donor')}
                  </td>
                  <td className="p-3 font-extrabold text-indigo-700">
                    {c.currency} {c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200 capitalize">
                      {c.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 capitalize font-semibold text-slate-600">
                    {c.payment_method.replace(/_/g, ' ')}
                  </td>
                  <td className="p-3 text-[10px] font-mono text-slate-400">
                    {c.reference_no || 'N/A'}
                  </td>
                  <td className="p-3 text-right pr-4 text-[10px] text-slate-500 font-semibold">
                    {c.giving_date}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
