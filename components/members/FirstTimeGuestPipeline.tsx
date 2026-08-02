'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const FirstTimeGuestPipeline: React.FC = () => {
  const { members } = useChurch();

  const guests = members.filter(m => m.status === 'first_time_guest');

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">First-Time Guest Intake Pipeline</h4>
          <p className="text-xs text-slate-500">Self-serve intake via QR / Welcome Desk</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200">
          {guests.length} New Guests
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {guests.length === 0 ? (
          <div className="col-span-2 text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
            <p className="text-xs font-bold text-slate-700">No new guests logged in the current intake window.</p>
          </div>
        ) : (
          guests.map((guest) => (
            <div key={guest.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{guest.first_name} {guest.last_name}</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Visited: {guest.first_visited_at}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">Phone: {guest.phone}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <a
                  href={`https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}?text=Welcome%20to%20Fountain%20Gate%20Chapel%20${encodeURIComponent(guest.first_name)}!%20We%20are%20so%20glad%20you%20worshipped%20with%20us.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-500 transition"
                >
                  Send Pastoral Welcome Message
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
