'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Member } from '../../lib/types/church';

export default function MembersPage() {
  const { members, deleteMember, searchQuery, currentRole } = useChurch();
  const [selectedCell, setSelectedCell] = useState('All');

  const isPastorOrAdmin = currentRole === 'admin' || currentRole === 'pastor';

  const cellGroups = ['All', ...Array.from(new Set(members.map(m => m.cell_group)))];

  const filteredMembers = members.filter(m => {
    const matchesSearch = searchQuery === '' || 
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);

    const matchesCell = selectedCell === 'All' || m.cell_group === selectedCell;

    return matchesSearch && matchesCell;
  });

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Shalom ${name}, greetings from Fountain Gate Chapel!`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
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
              ? `Managing ${members.length} registered church members and cell fellowship groups.`
              : `Connect and fellowship with ${members.length} brethren across Fountain Gate Chapel.`}
          </p>
        </div>
      </div>

      {/* Cell Group Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-none">
        {cellGroups.map(cell => (
          <button
            key={cell}
            onClick={() => setSelectedCell(cell)}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition border ${
              selectedCell === cell
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Members Directory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div key={member.id} className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 bg-white hover:border-indigo-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  {member.first_name} {member.last_name}
                </h3>
                <p className="text-xs text-indigo-600 font-semibold">{member.cell_group}</p>
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
                  <span className="font-semibold text-slate-400">City:</span>
                  <span>{member.address}</span>
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleWhatsApp(member.phone, `${member.first_name} ${member.last_name}`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition border border-emerald-200"
              >
                <span>💬 WhatsApp</span>
              </button>

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
    </div>
  );
}
