'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const MetricsOverview: React.FC = () => {
  const { members, contributions } = useChurch();

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const atRiskMembers = members.filter(m => m.status === 'at_risk').length;
  const newGuests = members.filter(m => m.status === 'first_time_guest').length;

  const totalGiving = contributions.reduce((acc, curr) => acc + curr.amount, 0);
  const targetBudget = 25000;
  const budgetPercentage = Math.round((totalGiving / targetBudget) * 100);

  const CARDS = [
    {
      title: 'Active Members',
      value: activeMembers,
      subtext: `${newGuests} First-time Guests registered`,
      badge: '+12% month',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      title: '4-Wk Attendance Avg',
      value: '428',
      subtext: '94% capacity at Main Sanctuary',
      badge: '94% Attendance',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      title: 'At-Risk Members',
      value: atRiskMembers,
      subtext: 'Requires immediate Pastoral care',
      badge: atRiskMembers > 0 ? 'Action Needed' : 'All Clear',
      badgeColor: atRiskMembers > 0 ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' : 'bg-emerald-100 text-emerald-800'
    },
    {
      title: 'Monthly Giving',
      value: `GHS ${totalGiving.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtext: `Target: GHS ${targetBudget.toLocaleString()} (${budgetPercentage}%)`,
      badge: `${budgetPercentage}% Target`,
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {CARDS.map((card, idx) => (
        <div key={idx} className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 block truncate">{card.title}</span>
            <h3 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 mt-2 sm:mt-3">{card.value}</h3>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="text-slate-500 text-[10px] sm:text-[11px] truncate">{card.subtext}</span>
            <span className={`self-start sm:self-auto px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${card.badgeColor}`}>
              {card.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
