'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Member } from '../../lib/types/church';

interface Props {
  onSelectMember: (member: Member) => void;
}

export const MemberDirectoryTable: React.FC<Props> = ({ onSelectMember }) => {
  const { members, currentRole, searchQuery } = useChurch();
  const [filterCell, setFilterCell] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isAdmin = currentRole === 'admin';

  const cellGroups = Array.from(new Set(members.map(m => m.cell_group)));

  const filteredMembers = members.filter((member) => {
    const matchesSearch = searchQuery === '' || 
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCell = filterCell === 'all' || member.cell_group === filterCell;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

    return matchesSearch && matchesCell && matchesStatus;
  });

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">
            Members Directory ({filteredMembers.length})
          </span>
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
              Admin Manual Intake Allowed
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={filterCell}
            onChange={(e) => setFilterCell(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
          >
            <option value="all">All Cell Groups</option>
            {cellGroups.map(cell => (
              <option key={cell} value={cell}>{cell}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="at_risk">At Risk</option>
            <option value="first_time_guest">First Time Guest</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3 pl-4">Member Name</th>
              <th className="p-3">Phone & Email</th>
              <th className="p-3">Cell Group</th>
              <th className="p-3">Status</th>
              <th className="p-3">Absences</th>
              <th className="p-3 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredMembers.map((member) => (
              <tr
                key={member.id}
                onClick={() => onSelectMember(member)}
                className="hover:bg-slate-50 cursor-pointer transition"
              >
                <td className="p-3 pl-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none">{member.first_name} {member.last_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Joined: {member.first_visited_at}</p>
                    </div>
                  </div>
                </td>

                <td className="p-3">
                  <p className="font-semibold text-slate-800">{member.phone}</p>
                  <p className="text-[10px] text-slate-400 truncate">{member.email || 'No email'}</p>
                </td>

                <td className="p-3 font-medium text-slate-700">
                  {member.cell_group}
                </td>

                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                    member.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    member.status === 'at_risk' ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' :
                    member.status === 'first_time_guest' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    'bg-slate-100 text-slate-600 border-slate-300'
                  }`}>
                    {member.status.replace(/_/g, ' ')}
                  </span>
                </td>

                <td className="p-3 font-semibold">
                  <span className={member.consecutive_absences >= 3 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                    {member.consecutive_absences} wks
                  </span>
                </td>

                <td className="p-3 text-right pr-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMember(member);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
