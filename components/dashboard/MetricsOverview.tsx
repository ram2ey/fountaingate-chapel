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
      title: 'Total Active Members',
      value: activeMembers,
      subtext: `${newGuests} First-time Guests registered`,
      badge: '+12% this month',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      title: '4-Week Avg Sunday Attendance',
      value: '428',
      subtext: '94% capacity at Main Sanctuary',
      badge: '94% Attendance Rate',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      title: 'At-Risk Members (3+ Wks Missed)',
      value: atRiskMembers,
      subtext: 'Requires immediate Pastoral care outreach',
      badge: atRiskMembers > 0 ? 'Action Required' : 'All Clear',
      badgeColor: atRiskMembers > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-300'
    },
    {
      title: 'Monthly Giving vs Target',
      value: `GHS ${totalGiving.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtext: `Target: GHS ${targetBudget.toLocaleString()} (${budgetPercentage}%)`,
      badge: `${budgetPercentage}% Target Reached`,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card, idx) => (
        <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">{card.title}</span>
            <h3 className="text-2xl font-display font-bold text-slate-100 mt-3">{card.value}</h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px] truncate max-w-[140px]">{card.subtext}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${card.badgeColor}`}>
              {card.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
