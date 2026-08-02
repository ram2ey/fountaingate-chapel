'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import Link from 'next/link';

export const AtRiskInterventionSummary: React.FC = () => {
  const { members } = useChurch();

  const atRiskList = members.filter(m => m.status === 'at_risk');

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-display font-bold text-base text-slate-100">Pastoral Intervention Queue</h4>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
            {atRiskList.length} At Risk
          </span>
        </div>
        <p className="text-xs text-slate-400">Members missing 3+ consecutive Sunday or Cell meetings</p>

        {/* Member Cards */}
        <div className="mt-4 space-y-2.5">
          {atRiskList.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-400 font-medium">No members currently flagged as at-risk.</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Attendance tracking is running smoothly!</p>
            </div>
          ) : (
            atRiskList.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-200">{member.first_name} {member.last_name}</p>
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 text-[10px] font-semibold">
                      {member.consecutive_absences} wks absent
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>{member.cell_group}</span>
                    <span>•</span>
                    <span className="text-slate-400">Last seen: {member.last_attended_at}</span>
                  </div>
                </div>

                {/* 1-Click Outreach Buttons */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=Shalom%20${encodeURIComponent(member.first_name)}%2C%20we%20missed%20you%20at%20Fountain%20Gate%20Chapel!%20Hope%20you%20are%20doing%20well.%20Pastoral%20care%20team.`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/40 transition text-[10px] font-semibold"
                    title="Send 1-Click WhatsApp Message"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${member.phone}`}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition text-[10px] font-semibold"
                    title="Direct Phone Call"
                  >
                    Call
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-right">
        <Link
          href="/pastoral-care"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
        >
          <span>View Full Care Queue ({atRiskList.length}) →</span>
        </Link>
      </div>
    </div>
  );
};
