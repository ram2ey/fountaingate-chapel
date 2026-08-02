'use client';

import React from 'react';
import { Member } from '../../lib/types/church';
import { useChurch } from '../../lib/context/ChurchContext';

interface Props {
  member: Member;
  onClose: () => void;
}

export const MemberProfileDrawer: React.FC<Props> = ({ member, onClose }) => {
  const { careNotes } = useChurch();
  const memberNotes = careNotes.filter(n => n.member_id === member.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-bold text-xl flex items-center justify-center shadow-lg">
                {member.first_name[0]}{member.last_name[0]}
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">
                  {member.first_name} {member.last_name}
                </h3>
                <p className="text-xs text-amber-300 font-semibold mt-0.5">{member.cell_group}</p>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-5 text-xs text-slate-700">
            {/* Quick Contact Bar */}
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center transition shadow-sm"
              >
                WhatsApp Member
              </a>
              <a
                href={`tel:${member.phone}`}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition border border-slate-300"
              >
                Call Phone
              </a>
            </div>

            {/* General Information */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Member Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Status</span>
                  <span className="font-bold text-indigo-700 capitalize">{member.status.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Absences</span>
                  <span className="font-bold text-slate-800">{member.consecutive_absences} consecutive</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date of Birth</span>
                  <span className="font-medium text-slate-800">{member.dob || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">First Visited</span>
                  <span className="font-medium text-slate-800">{member.first_visited_at}</span>
                </div>
              </div>
            </div>

            {/* Care History */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Pastoral Care Notes ({memberNotes.length})</h4>
              {memberNotes.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No pastoral care notes logged yet.</p>
              ) : (
                memberNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-indigo-800 font-bold">
                      <span>{note.created_at}</span>
                      {note.is_confidential && <span className="text-rose-600 font-bold">[CONFIDENTIAL]</span>}
                    </div>
                    <p className="text-xs text-slate-800 font-medium">{note.note}</p>
                    {note.action_item && (
                      <p className="text-[10px] text-amber-700 font-semibold mt-1">Action: {note.action_item}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
