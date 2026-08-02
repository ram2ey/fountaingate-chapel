'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const ConfidentialCareLog: React.FC = () => {
  const { careNotes, currentRole, addCareNote, members } = useChurch();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [noteText, setNoteText] = useState('');
  const [actionItem, setActionItem] = useState('');
  const [isConfidential, setIsConfidential] = useState(true);

  const canViewConfidential = ['admin', 'pastor'].includes(currentRole);

  const visibleNotes = careNotes.filter(n => {
    if (!canViewConfidential && n.is_confidential) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !noteText) return;

    const targetMember = members.find(m => m.id === selectedMemberId);

    addCareNote({
      member_id: selectedMemberId,
      member_name: targetMember ? `${targetMember.first_name} ${targetMember.last_name}` : 'Church Member',
      pastor_id: 'p1',
      pastor_name: 'Rev. Dr. Eastwood Anaba',
      note: noteText,
      is_confidential: isConfidential,
      action_item: actionItem || undefined,
      follow_up_date: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0]
    });

    setNoteText('');
    setActionItem('');
    setShowAddForm(false);
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-white">
            Confidential Pastoral Log & Counseling Records
          </h3>
          <p className="text-xs text-slate-400">
            Encrypted care logs restricted to ordained pastors and senior care leaders.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0"
        >
          <span>+ New Pastoral Log</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 text-xs animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Member</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Action / Follow-up Item</label>
              <input
                type="text"
                value={actionItem}
                onChange={(e) => setActionItem(e.target.value)}
                placeholder="e.g. Schedule follow up call next Tuesday"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Pastoral Note Content</label>
            <textarea
              rows={3}
              required
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Record pastoral counseling insights, prayer points, hospital visitation notes..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600"
              />
              <span className="font-medium text-amber-300">Flag as Confidential (Restricted Access)</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              Save Pastoral Record
            </button>
          </div>
        </form>
      )}

      {/* Log list */}
      <div className="space-y-3">
        {visibleNotes.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-4">No pastoral logs logged yet.</p>
        ) : (
          visibleNotes.map(note => (
            <div key={note.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 text-sm">{note.member_name}</span>
                  {note.is_confidential && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      Confidential
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">{note.created_at}</span>
              </div>

              <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                "{note.note}"
              </p>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-indigo-400 font-semibold">Logged by: {note.pastor_name}</span>
                {note.action_item && (
                  <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    Next Action: {note.action_item}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
