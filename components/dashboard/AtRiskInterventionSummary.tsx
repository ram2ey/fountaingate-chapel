'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import Link from 'next/link';

export const AtRiskInterventionSummary: React.FC = () => {
  const { members } = useChurch();

  const atRiskList = members.filter(m => m.status === 'at_risk');

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-display font-bold text-base text-slate-900">Pastoral Care Queue</h4>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
            {atRiskList.length} At Risk
          </span>
        </div>
        <p className="text-xs text-slate-500">Members missing 3+ consecutive Sunday or Cell meetings</p>

        {/* Member Cards */}
        <div className="mt-4 space-y-2.5">
          {atRiskList.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs text-slate-700 font-bold">No members currently flagged as at-risk.</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Attendance tracking is running smoothly!</p>
            </div>
          ) : (
            atRiskList.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">{member.first_name} {member.last_name}</p>
                    <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                      {member.consecutive_absences} wks absent
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                    <span>{member.cell_group}</span>
                    <span>•</span>
                    <span>Last seen: {member.last_attended_at}</span>
                  </div>
                </div>

                {/* Outreach Buttons */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=Shalom%20${encodeURIComponent(member.first_name)}%2C%20we%20missed%20you%20at%20Fountain%20Gate%20Chapel!%20Hope%20you%20are%20doing%20well.%20Pastoral%20care%20team.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm transition"
                    title="Send WhatsApp Message"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-right">
        <Link
          href="/pastoral-care"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
        >
          <span>View Full Care Queue ({atRiskList.length}) →</span>
        </Link>
      </div>
    </div>
  );
};
