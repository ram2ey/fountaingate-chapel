'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const MilestonesCalendar: React.FC = () => {
  const { members } = useChurch();
  const membersWithBirthdays = members.filter(m => m.dob);

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-white">
            Member Birthday Milestone Reminders
          </h3>
          <p className="text-xs text-slate-400">
            Automatic pastoral alerts and 1-click WhatsApp greetings for upcoming member birthdays.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
          {membersWithBirthdays.length} Recorded Birthdays
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {membersWithBirthdays.map(m => (
          <div key={m.id} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-md">
            <div>
              <p className="font-bold text-slate-200">{m.first_name} {m.last_name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Birthday: <strong className="text-indigo-300">{m.dob}</strong>
              </p>
            </div>
            <a
              href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}?text=Happy%20Birthday%20${encodeURIComponent(m.first_name)}!%20May%20God's%20grace%20abound%20towards%20you.%20From%20Fountain%20Gate%20Chapel!`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-600/40"
            >
              Wish WhatsApp
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
