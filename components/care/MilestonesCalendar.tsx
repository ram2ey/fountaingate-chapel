'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const MilestonesCalendar: React.FC = () => {
  const { members } = useChurch();

  const birthdayMembers = members.filter(m => m.dob);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">Member Birthday Milestones</h4>
          <p className="text-xs text-slate-500">Upcoming birthdays for pastoral felicitations</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
          Birthday Blessings
        </span>
      </div>

      <div className="space-y-2 mt-4">
        {birthdayMembers.map((member) => {
          const cleanPhone = member.phone.replace(/[^0-9]/g, '');
          const message = encodeURIComponent(`Shalom ${member.first_name}, happy birthday from Fountain Gate Chapel! May God multiply His grace, wisdom, and blessings upon your life this year! 🎉🎂`);

          return (
            <div key={member.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900 text-xs">{member.first_name} {member.last_name}</p>
                <p className="text-[10px] text-slate-500">DOB: {member.dob} {member.address ? `• ${member.address}` : ''}</p>
              </div>
              <a
                href={`https://wa.me/${cleanPhone}?text=${message}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition shrink-0"
              >
                💬 WhatsApp Blessing
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
