'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const FinancialBreakdownChart: React.FC = () => {
  const { contributions } = useChurch();

  const titheTotal = contributions.filter(c => c.type === 'tithe').reduce((a, b) => a + b.amount, 0);
  const offeringTotal = contributions.filter(c => c.type === 'offering').reduce((a, b) => a + b.amount, 0);
  const buildingTotal = contributions.filter(c => c.type === 'building_fund').reduce((a, b) => a + b.amount, 0);
  const specialTotal = contributions.filter(c => c.type === 'special_seed' || c.type === 'missions').reduce((a, b) => a + b.amount, 0);

  const data = [
    { name: 'Tithes', value: titheTotal || 1500, color: '#4f46e5' },
    { name: 'Sunday Offering', value: offeringTotal || 8450, color: '#f59e0b' },
    { name: 'Building Fund', value: buildingTotal || 2500, color: '#10b981' },
    { name: 'Special Seed', value: specialTotal || 1200, color: '#0284c7' },
  ];

  const totalSum = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-display font-bold text-base text-slate-900">Financial Giving Breakdown</h4>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
            Ledger Active
          </span>
        </div>
        <p className="text-xs text-slate-500">Distribution across giving funds</p>
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
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(val: number) => [`GHS ${val.toLocaleString()}`, 'Amount']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Recorded</span>
          <span className="text-sm font-extrabold text-slate-900 font-display">GHS {totalSum.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <div className="truncate">
              <p className="text-[11px] text-slate-700 font-semibold truncate">{item.name}</p>
              <p className="text-[10px] text-slate-500 font-bold">GHS {item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
