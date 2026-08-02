'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Contribution } from '../../lib/types/church';
import { RecordGivingModal } from './RecordGivingModal';

export const GivingLedgerTable: React.FC = () => {
  const { contributions, currentBranch } = useChurch();
  const [filterType, setFilterType] = useState('all');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  const filteredContributions = contributions.filter(c => {
    return filterType === 'all' || c.type === filterType;
  });

  const totalSum = filteredContributions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <h4 className="font-display font-bold text-base text-white">Giving & Tithe Ledger</h4>
          <p className="text-xs text-slate-400">Total Filtered Recorded: <strong className="text-emerald-400 font-bold">GHS {totalSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'tithe', 'offering', 'building_fund', 'special_seed'].map((typeKey) => (
            <button
              key={typeKey}
              onClick={() => setFilterType(typeKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition whitespace-nowrap ${
                filterType === typeKey
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {typeKey.replace('_', ' ')}
            </button>
          ))}

          <button
            onClick={() => setShowGatewayModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 shrink-0"
          >
            Online Payment Link (MoMo/Card)
          </button>

          <button
            onClick={() => setShowRecordModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shrink-0"
          >
            + Record Entry
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Donor Name</th>
                <th className="py-3.5 px-4">Giving Fund</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Ref / Receipt #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredContributions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No recorded giving entries found.
                  </td>
                </tr>
              ) : (
                filteredContributions.map((contrib) => (
                  <tr key={contrib.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-200">{contrib.donor_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 uppercase">
                        {contrib.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 capitalize">{contrib.payment_method.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{contrib.reference_no || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-400">{contrib.giving_date}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                      {contrib.currency} {contrib.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Gateway Modal */}
      {showGatewayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-display font-bold text-base text-white">
                Online Payment Gateway Integration
              </h4>
              <button onClick={() => setShowGatewayModal(false)} className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Integrated local payment checkout links for Mobile Money (MTN MoMo, Telecel Cash, AT Money) & Visa/Mastercard payments.
            </p>

            <div className="space-y-2 text-xs">
              <a
                href="https://paystack.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">Paystack MoMo & Card Checkout</p>
                  <p className="text-[10px] text-slate-400">Direct integration link for Ghana/Nigeria givers</p>
                </div>
                <span className="text-emerald-400 font-bold text-xs">Open ↗</span>
              </a>

              <a
                href="https://flutterwave.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">Flutterwave Multi-Currency Link</p>
                  <p className="text-[10px] text-slate-400">Supports GHS, USD, GBP, EUR giving</p>
                </div>
                <span className="text-amber-400 font-bold text-xs">Open ↗</span>
              </a>
            </div>

            <button
              onClick={() => setShowGatewayModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {showRecordModal && <RecordGivingModal onClose={() => setShowRecordModal(false)} />}
    </div>
  );
};
