'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

interface Props {
  onClose: () => void;
}

export const RapidCheckInModal: React.FC<Props> = ({ onClose }) => {
  const { members, recordAttendance } = useChurch();
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [eventType, setEventType] = useState<'Sunday Service' | 'Mid-week Cell' | 'Night Vigil'>('Sunday Service');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    const member = members.find(m => m.id === selectedMemberId);
    recordAttendance([selectedMemberId], eventType);

    setSuccessMsg(`Attendance marked for ${member?.first_name} ${member?.last_name}!`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-display font-bold text-xl text-slate-900">Rapid Attendance Check-In</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {successMsg ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-center font-bold text-sm animate-in zoom-in-95">
            ✓ {successMsg}
          </div>
        ) : (
          <form onSubmit={handleCheckIn} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Select Service / Meeting *</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="Sunday Service">Sunday Main Service</option>
                <option value="Mid-week Cell">Mid-week Cell Group</option>
                <option value="Night Vigil">All-Night Vigil</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Select Member *</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition"
              >
                Record Attendance ✓
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
