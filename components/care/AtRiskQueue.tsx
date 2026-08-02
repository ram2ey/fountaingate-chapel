'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const AtRiskQueue: React.FC = () => {
  const { members, recordAttendance } = useChurch();

  const atRiskMembers = members.filter(m => m.status === 'at_risk');

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">At-Risk Member Intervention Queue</h4>
          <p className="text-xs text-slate-500">Automated engine flags members missing 3+ consecutive services</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200">
          {atRiskMembers.length} Require Outreach
        </span>
      </div>

      <div className="space-y-3">
        {atRiskMembers.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
            <p className="text-xs font-bold text-slate-700">No members currently flagged as at-risk.</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Attendance tracking is running smoothly!</p>
          </div>
        ) : (
          atRiskMembers.map((member) => (
            <div key={member.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-xs shrink-0">
                    {member.first_name[0]}{member.last_name[0]}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{member.first_name} {member.last_name}</h5>
                    <p className="text-[10px] text-slate-500">{member.cell_group} • Phone: {member.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                    {member.consecutive_absences} Absences
                  </span>
                  <span className="text-[10px] text-slate-400">Last: {member.last_attended_at}</span>
                </div>
              </div>

              {/* Outreach Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=Shalom%20${encodeURIComponent(member.first_name)}%2C%20we%20missed%20you%20at%20Fountain%20Gate%20Chapel!%20Hope%20you%20are%20doing%20well.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
                >
                  WhatsApp Outreach
                </a>

                <button
                  onClick={() => recordAttendance([member.id], 'Sunday Service')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition"
                >
                  Mark Present Today
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
