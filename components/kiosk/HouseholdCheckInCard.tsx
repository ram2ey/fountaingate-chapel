'use client';

import React, { useState } from 'react';
import { Member } from '../../lib/types/church';
import { Users, UserCheck, CheckCircle2, Heart } from 'lucide-react';

interface Props {
  primaryMember: Member;
  familyMembers: Member[];
  onCheckInFamily: (memberNames: string[], memberIds: string[]) => void;
  onCancel: () => void;
}

export const HouseholdCheckInCard: React.FC<Props> = ({
  primaryMember,
  familyMembers,
  onCheckInFamily,
  onCancel,
}) => {
  const allHousehold = [primaryMember, ...familyMembers];
  const [selectedIds, setSelectedIds] = useState<string[]>(allHousehold.map(m => m.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const names = allHousehold.filter(m => selectedIds.includes(m.id)).map(m => `${m.first_name} ${m.last_name}`);
    onCheckInFamily(names, selectedIds);
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-indigo-500/40 space-y-5 bg-slate-900/90 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">Household Check-In</h3>
            <p className="text-xs text-slate-400">Select family members worshipping today</p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-2.5">
        {allHousehold.map(member => {
          const isChecked = selectedIds.includes(member.id);
          return (
            <div
              key={member.id}
              onClick={() => toggleSelect(member.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                isChecked
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                  isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'
                }`}>
                  {isChecked && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-200">{member.first_name} {member.last_name}</p>
                  <p className="text-xs text-slate-400">{member.cell_group} • {member.phone}</p>
                </div>
              </div>

              <span className="text-xs font-semibold text-indigo-300">
                {member.id === primaryMember.id ? 'Household Head' : 'Family Member'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          onClick={handleConfirm}
          disabled={selectedIds.length === 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 transition"
        >
          <UserCheck className="w-5 h-5" />
          <span>Confirm & Check In ({selectedIds.length} Members)</span>
        </button>
      </div>
    </div>
  );
};
