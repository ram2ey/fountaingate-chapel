'use client';

import React from 'react';
import { Member } from '../../lib/types/church';
import { useChurch } from '../../lib/context/ChurchContext';

interface Props {
  member: Member;
  onClose: () => void;
}

export const MemberProfileDrawer: React.FC<Props> = ({ member, onClose }) => {
  const { careNotes, contributions } = useChurch();

  const memberNotes = careNotes.filter(n => n.member_id === member.id);
  const memberContributions = contributions.filter(c => c.member_id === member.id);
  const totalGiven = memberContributions.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md h-full glass-panel border-l border-slate-700 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {member.first_name[0]}{member.last_name[0]}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  {member.first_name} {member.last_name}
                </h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 uppercase ${
                  member.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : member.status === 'at_risk'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {member.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Quick Contact & WhatsApp */}
          <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Mobile Contact</p>
              <p className="font-bold text-slate-200 mt-0.5">{member.phone}</p>
            </div>
            <a
              href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=Shalom%20${encodeURIComponent(member.first_name)}%2C%20greetings%20from%20Fountain%20Gate%20Chapel!`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md text-xs"
            >
              WhatsApp Direct
            </a>
          </div>

          {/* Details Grid */}
          <div className="mt-6 space-y-3 text-xs">
            <h4 className="font-display font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Personal Information
            </h4>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Cell Group</span>
              <span className="font-bold text-slate-200 mt-0.5 block">{member.cell_group}</span>
            </div>

            {member.email && (
              <div className="p-2.5 rounded-xl bg-slate-900/40 text-slate-300">
                <span className="text-[10px] text-slate-400 block font-medium">Email Address</span>
                <span className="font-semibold">{member.email}</span>
              </div>
            )}

            {member.dob && (
              <div className="p-2.5 rounded-xl bg-slate-900/40 text-slate-300">
                <span className="text-[10px] text-slate-400 block font-medium">Birthday</span>
                <span className="font-semibold text-amber-300">{member.dob}</span>
              </div>
            )}

            {member.address && (
              <div className="p-2.5 rounded-xl bg-slate-900/40 text-slate-300">
                <span className="text-[10px] text-slate-400 block font-medium">Residential Address</span>
                <span className="font-semibold">{member.address}</span>
              </div>
            )}

            {/* Tags */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1.5">Assigned Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {member.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Recorded Contributions
                </h4>
                <span className="text-xs font-bold text-emerald-400">GHS {totalGiven.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-slate-400">Total tithes & building seeds recorded on ledger</p>
            </div>

            {/* Pastoral Care Notes History */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="font-display font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                Pastoral Care Logs ({memberNotes.length})
              </h4>
              {memberNotes.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No care notes logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {memberNotes.map(note => (
                    <div key={note.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-semibold text-indigo-300">{note.pastor_name}</span>
                        <span>{note.created_at}</span>
                      </div>
                      <p className="text-slate-200">{note.note}</p>
                      {note.action_item && (
                        <p className="text-amber-300 font-semibold mt-1">Action: {note.action_item}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Member Profile
          </button>
        </div>
      </div>
    </div>
  );
};
