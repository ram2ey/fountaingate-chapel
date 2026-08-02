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
  { week: 'Week 1', sunday: 390, cellGroup: 210, guests: 14 },
  { week: 'Week 2', sunday: 415, cellGroup: 240, guests: 22 },
  { week: 'Week 3', sunday: 405, cellGroup: 235, guests: 18 },
  { week: 'Week 4', sunday: 442, cellGroup: 268, guests: 29 },
];

export const AttendanceChart: React.FC = () => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-display font-bold text-base text-slate-100">Attendance Growth Trends</h4>
          <p className="text-xs text-slate-400">Sunday Main Service vs Mid-week Cell Groups</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-slate-300">Sunday Service</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Cell Groups</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ATTENDANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSunday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="sunday" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSunday)" />
            <Area type="monotone" dataKey="cellGroup" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCell)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
