'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const ConfidentialCareLog: React.FC = () => {
  const { members, careNotes, addCareNote } = useChurch();

  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [noteText, setNoteText] = useState('');
  const [actionItem, setActionItem] = useState('');
  const [isConfidential, setIsConfidential] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !noteText) return;

    const member = members.find(m => m.id === selectedMemberId);

    addCareNote({
      member_id: selectedMemberId,
      member_name: member ? `${member.first_name} ${member.last_name}` : 'Member',
      pastor_id: 'p-001',
      pastor_name: 'Rev. Eastwood Anaba',
      note: noteText,
      is_confidential: isConfidential,
      action_item: actionItem || undefined
    });

    setNoteText('');
    setActionItem('');
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-base text-slate-900">Confidential Pastoral Counseling Log</h4>
          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
            Encrypted Pastoral View
          </span>
        </div>
        <p className="text-xs text-slate-500">Record visitation records, counseling notes, and prayer requests.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-700 font-bold mb-1">Select Member *</label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name} ({m.cell_group})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Pastoral Note & Counseling Record *</label>
          <textarea
            rows={3}
            required
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Record confidential notes, family updates, or visitation summaries..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Follow-Up Action Item</label>
          <input
            type="text"
            value={actionItem}
            onChange={(e) => setActionItem(e.target.value)}
            placeholder="e.g. Schedule home visit on Thursday"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-700 font-bold text-xs">Mark as Confidential (Pastors Only)</span>
          </label>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition"
          >
            Log Care Record
          </button>
        </div>
      </form>

      {/* Log Feed */}
      <div className="pt-4 border-t border-slate-200 space-y-2.5">
        <h5 className="font-bold text-slate-800 text-xs">Recent Care Notes ({careNotes.length})</h5>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {careNotes.map((note) => {
            const member = members.find(m => m.id === note.member_id);
            return (
              <div key={note.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-indigo-700">{member?.first_name} {member?.last_name}</span>
                  <span className="text-slate-400">{note.created_at}</span>
                </div>
                <p className="text-xs text-slate-800 font-medium">{note.note}</p>
                {note.action_item && (
                  <p className="text-[10px] text-amber-700 font-bold">Action: {note.action_item}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
