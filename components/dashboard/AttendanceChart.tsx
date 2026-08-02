'use client';

import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

const ATTENDANCE_DATA = [
  { week: 'Wk 1', sunday: 390, cellGroup: 210, guests: 14 },
  { week: 'Wk 2', sunday: 415, cellGroup: 240, guests: 22 },
  { week: 'Wk 3', sunday: 405, cellGroup: 235, guests: 18 },
  { week: 'Wk 4', sunday: 442, cellGroup: 268, guests: 29 },
];

export const AttendanceChart: React.FC = () => {
  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">Attendance Growth Trends</h4>
          <p className="text-xs text-slate-500">Sunday Service vs Mid-week Cell Groups</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-slate-700">Sunday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700">Cell Groups</span>
          </div>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ATTENDANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSunday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
            <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Area type="monotone" dataKey="sunday" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSunday)" />
            <Area type="monotone" dataKey="cellGroup" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCell)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
