'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Member } from '../../lib/types/church';
import { MemberProfileDrawer } from './MemberProfileDrawer';

export const MemberDirectoryTable: React.FC<{ onOpenAddModal: () => void }> = ({ onOpenAddModal }) => {
  const { members, deleteMember, searchQuery, setSearchQuery, currentRole } = useChurch();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [activeDrawerMember, setActiveDrawerMember] = useState<Member | null>(null);

  const isAdmin = currentRole === 'admin';

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.cell_group.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatusFilter === 'all' || m.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, cell group, or tag..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filters & Admin Add Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {['all', 'active', 'at_risk', 'first_time_guest', 'inactive'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setSelectedStatusFilter(statusKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition whitespace-nowrap ${
                selectedStatusFilter === statusKey
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {statusKey.replace('_', ' ')}
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shrink-0"
              title="Admin Only Manual Intake"
            >
              <span>+ Add Member (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Cell / Small Group</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Tags</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No member records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => setActiveDrawerMember(member)}
                  >
                    {/* Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 group-hover:text-amber-300 transition">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-[10px] text-slate-400">ID: {member.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-300">{member.phone}</p>
                      <p className="text-[10px] text-slate-400">{member.email || 'No email'}</p>
                    </td>

                    {/* Cell Group */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium text-[11px]">
                        {member.cell_group}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        member.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : member.status === 'at_risk'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                          : member.status === 'first_time_guest'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {member.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {member.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {t}
                          </span>
                        ))}
                        {member.tags.length > 2 && (
                          <span className="text-[10px] text-slate-500">+{member.tags.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=Shalom%20${encodeURIComponent(member.first_name)}%2C%20greetings%20from%20Fountain%20Gate%20Chapel!`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-500/30 transition text-[10px] font-semibold"
                          title="WhatsApp Direct Link"
                        >
                          WhatsApp
                        </a>
                        <button
                          onClick={() => setActiveDrawerMember(member)}
                          className="px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30 transition text-[10px] font-semibold"
                          title="View Complete Profile"
                        >
                          Profile
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => deleteMember(member.id)}
                            className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition text-[10px] font-semibold"
                            title="Delete Member (Admin Only)"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {activeDrawerMember && (
        <MemberProfileDrawer
          member={activeDrawerMember}
          onClose={() => setActiveDrawerMember(null)}
        />
      )}
    </div>
  );
};
