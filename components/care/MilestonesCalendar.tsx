'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const MilestonesCalendar: React.FC = () => {
  const { members } = useChurch();

  // Filter birthdays in current month
  const birthdayMembers = members.filter(m => m.dob);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">Member Birthday Milestones</h4>
          <p className="text-xs text-slate-500">Upcoming birthdays for pastoral felicitations</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
          August Birthdays
        </span>
      </div>

      <div className="space-y-2 mt-4">
        {birthdayMembers.map((member) => (
          <div key={member.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-xs">{member.first_name} {member.last_name}</p>
              <p className="text-[10px] text-slate-500">{member.cell_group} • DOB: {member.dob}</p>
            </div>
            <a
              href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=Happy%20Birthday%20${encodeURIComponent(member.first_name)}!%20Fountain%20Gate%20Chapel%20prays%20God's%20abundant%20blessings%20upon%20your%20new%20age.`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] shadow-sm transition"
            >
              Send Birthday Wishes
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
