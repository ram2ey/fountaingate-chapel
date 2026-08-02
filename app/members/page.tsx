'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export default function MembersPage() {
  const { members, deleteMember, addCareNote, currentRole, currentUser } = useChurch();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pastoral Care Note Modal State
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isConfidential, setIsConfidential] = useState(true);

  const isPastorOrAdmin = currentRole === 'admin' || currentRole === 'pastor';

  // Multi-Field Search Filter (Name, Phone, Address/City)
  const filteredMembers = members.filter(m => {
    const cleanSearch = searchTerm.trim().toLowerCase();

    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const phone = m.phone.toLowerCase();
    const address = (m.address || '').toLowerCase();

    return cleanSearch === '' || 
      fullName.includes(cleanSearch) ||
      phone.includes(cleanSearch) ||
      address.includes(cleanSearch);
  });

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Shalom ${name}, greetings from Fountain Gate Chapel!`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleSaveCareNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !noteText.trim()) return;

    addCareNote({
      member_id: selectedMember.id,
      member_name: selectedMember.name,
      pastor_id: currentUser?.id || 'u1',
      pastor_name: currentUser?.full_name || 'Pastor',
      note: noteText.trim(),
      is_confidential: isConfidential
    });

    setSelectedMember(null);
    setNoteText('');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            {isPastorOrAdmin ? 'Member Directory & Pastoral Care' : 'Church Brethren Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isPastorOrAdmin 
              ? `Managing ${members.length} registered church members across Fountain Gate Chapel.`
              : `Connect and fellowship with ${members.length} brethren across Fountain Gate Chapel.`}
          </p>
        </div>
      </div>

      {/* Dedicated Search Input Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search brethren by Name, Phone (+233...), or City (e.g. Accra, Bolga)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-indigo-600 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Members Directory List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-3xl bg-white border border-slate-200 space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold text-xl">
            🔍
          </div>
          <h3 className="font-display font-bold text-slate-900 text-base">No Brethren Match Search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try clearing your search term to view full directory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div key={member.id} className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 bg-white hover:border-indigo-300 transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    {member.first_name} {member.last_name}
                  </h3>
                </div>

                {/* Show internal status tags only to Pastors/Admins */}
                {isPastorOrAdmin && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    member.status === 'at_risk' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {member.status.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-400">Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{member.phone}</span>
                </p>
                {member.address && (
                  <p className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400">City / Address:</span>
                    <span>{member.address}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => handleWhatsApp(member.phone, `${member.first_name} ${member.last_name}`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition border border-emerald-200"
                >
                  <span>💬 WhatsApp</span>
                </button>

                {isPastorOrAdmin && (
                  <button
                    onClick={() => setSelectedMember({ id: member.id, name: `${member.first_name} ${member.last_name}` })}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition"
                  >
                    + Care Note
                  </button>
                )}

                {currentRole === 'admin' && (
                  <button
                    onClick={() => deleteMember(member.id)}
                    className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold"
                    title="Delete Member"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pastoral Care Note Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Log Pastoral Care Note</h3>
                <p className="text-xs text-indigo-600 font-semibold">{selectedMember.name}</p>
              </div>
              <button onClick={() => setSelectedMember(null)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCareNote} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Care & Counseling Note *</label>
                <textarea
                  required
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record details of pastoral visit, phone counseling, or prayer follow-up..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                />
              </div>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 cursor-pointer">
                <div>
                  <p className="font-bold text-indigo-900">Confidential Note</p>
                  <p className="text-[10px] text-slate-500">Restricted to Pastoral Team</p>
                </div>
                <input
                  type="checkbox"
                  checked={isConfidential}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Save Care Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
