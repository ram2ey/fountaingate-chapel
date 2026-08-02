'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const FirstTimeGuestPipeline: React.FC = () => {
  const { guestRetention, updateGuestRetention } = useChurch();

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display font-bold text-base text-slate-100">
            First-Time Guest Automated Retention Pipeline
          </h4>
          <p className="text-xs text-slate-400">Structured 7-day retention journey for new visitors</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
          {guestRetention.length} Guests In Pipeline
        </span>
      </div>

      <div className="space-y-3">
        {guestRetention.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500">No guests currently in retention pipeline.</p>
          </div>
        ) : (
          guestRetention.map(item => (
            <div key={item.id} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h5 className="font-bold text-sm text-slate-200">{item.guest_name}</h5>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{item.phone}</span>
                    <span>•</span>
                    <span>First Visit: {item.first_visit_date}</span>
                  </p>
                </div>
                {item.notes && (
                  <p className="text-xs text-slate-400 italic bg-slate-950 p-2 rounded-lg border border-slate-800">
                    "{item.notes}"
                  </p>
                )}
              </div>

              {/* Retention Workflow Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Step 1: Day 1 Welcome */}
                <div className={`p-3 rounded-xl border transition ${
                  item.day1_welcome_sent
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[11px]">Day 1: Welcome SMS/WhatsApp</span>
                    {item.day1_welcome_sent && <span className="text-emerald-400 font-bold">✓</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">Automated warm message delivered to phone.</p>
                  <button
                    onClick={() => updateGuestRetention(item.id, { day1_welcome_sent: !item.day1_welcome_sent })}
                    className={`w-full py-1 rounded-lg text-[10px] font-bold border transition ${
                      item.day1_welcome_sent
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {item.day1_welcome_sent ? 'Sent ✓' : 'Trigger Welcome SMS'}
                  </button>
                </div>

                {/* Step 2: Day 3 Call */}
                <div className={`p-3 rounded-xl border transition ${
                  item.day3_call_done
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[11px]">Day 3: Pastoral Follow-up Call</span>
                    {item.day3_call_done && <span className="text-emerald-400 font-bold">✓</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">Assigned task for pastoral telephone check-in.</p>
                  <button
                    onClick={() => updateGuestRetention(item.id, { day3_call_done: !item.day3_call_done })}
                    className={`w-full py-1 rounded-lg text-[10px] font-bold border transition ${
                      item.day3_call_done
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    }`}
                  >
                    {item.day3_call_done ? 'Call Logged ✓' : 'Log Phone Call'}
                  </button>
                </div>

                {/* Step 3: Day 7 Class */}
                <div className={`p-3 rounded-xl border transition ${
                  item.day7_class_invited
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[11px]">Day 7: New Believers Class</span>
                    {item.day7_class_invited && <span className="text-emerald-400 font-bold">✓</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">Invitation to Believers Foundations Class.</p>
                  <button
                    onClick={() => updateGuestRetention(item.id, { day7_class_invited: !item.day7_class_invited })}
                    className={`w-full py-1 rounded-lg text-[10px] font-bold border transition ${
                      item.day7_class_invited
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {item.day7_class_invited ? 'Invited ✓' : 'Send Class Invite'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
