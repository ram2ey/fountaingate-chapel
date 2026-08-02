'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet } from 'lucide-react';

export const FinancialBreakdownChart: React.FC = () => {
  const { contributions } = useChurch();

  const titheTotal = contributions.filter(c => c.type === 'tithe').reduce((a, b) => a + b.amount, 0);
  const offeringTotal = contributions.filter(c => c.type === 'offering').reduce((a, b) => a + b.amount, 0);
  const buildingTotal = contributions.filter(c => c.type === 'building_fund').reduce((a, b) => a + b.amount, 0);
  const specialTotal = contributions.filter(c => c.type === 'special_seed' || c.type === 'missions').reduce((a, b) => a + b.amount, 0);

  const data = [
    { name: 'Tithes', value: titheTotal || 1500, color: '#6366f1' },
    { name: 'Sunday Offering', value: offeringTotal || 8450, color: '#f59e0b' },
    { name: 'Building Fund', value: buildingTotal || 2500, color: '#10b981' },
    { name: 'Special Seed & Missions', value: specialTotal || 1200, color: '#38bdf8' },
  ];

  const totalSum = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-display font-bold text-base text-slate-100">Financial Giving Breakdown</h4>
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Wallet className="w-4 h-4" />
          </span>
        </div>
        <p className="text-xs text-slate-400">Distribution across giving funds</p>
      </div>

      <div className="h-44 w-full relative my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={75}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              formatter={(val: number) => [`GHS ${val.toLocaleString()}`, 'Amount']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Recorded</span>
          <span className="text-sm font-bold text-slate-100 font-display">GHS {totalSum.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <div className="truncate">
              <p className="text-[11px] text-slate-300 font-medium truncate">{item.name}</p>
              <p className="text-[10px] text-slate-400 font-bold">GHS {item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
