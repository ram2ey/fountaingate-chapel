'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const RapidCheckInModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { members, recordAttendance, currentBranch } = useChurch();

  const [selectedEventType, setSelectedEventType] = useState<'Sunday Service' | 'Mid-week Cell' | 'Night Vigil'>('Sunday Service');
  const [checkedMemberIds, setCheckedMemberIds] = useState<string[]>(
    members.filter(m => m.consecutive_absences === 0).map(m => m.id)
  );
  const [search, setSearch] = useState('');

  const filtered = members.filter(m => 
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search) ||
    m.cell_group.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCheck = (id: string) => {
    setCheckedMemberIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    recordAttendance(checkedMemberIds, selectedEventType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Rapid Service & Cell Check-In</h3>
              <p className="text-xs text-slate-400">Mark attendance for {currentBranch.name}</p>
            </div>
            <button onClick={onClose} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-bold">
              ✕
            </button>
          </div>

          {/* Event Selector & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 text-xs">
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              {(['Sunday Service', 'Mid-week Cell', 'Night Vigil'] as const).map(evt => (
                <button
                  key={evt}
                  onClick={() => setSelectedEventType(evt)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    selectedEventType === evt ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {evt}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member name or cell..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Member Selection List */}
          <div className="space-y-2 max-h-[42h] overflow-y-auto pr-1">
            {filtered.map(member => {
              const isChecked = checkedMemberIds.includes(member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => toggleCheck(member.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition font-bold text-xs ${
                      isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-950'
                    }`}>
                      {isChecked ? '✓' : ''}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-200">{member.first_name} {member.last_name}</p>
                      <p className="text-[10px] text-slate-400">{member.cell_group} • {member.phone}</p>
                    </div>
                  </div>

                  {member.status === 'at_risk' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                      {member.consecutive_absences} Wks Absent
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold">
            {checkedMemberIds.length} of {members.length} Members Checked In
          </span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-900/50"
            >
              Record Service Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
