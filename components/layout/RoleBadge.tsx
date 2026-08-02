'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { UserRole } from '../../lib/types/church';

const ROLES: { id: UserRole; label: string; color: string }[] = [
  { id: 'admin', label: 'Admin', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { id: 'pastor', label: 'Pastor', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 'member', label: 'Member', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
];

export const RoleBadge: React.FC = () => {
  const { currentRole, setCurrentRole } = useChurch();
  const [isOpen, setIsOpen] = useState(false);

  const activeRoleObj = ROLES.find(r => r.id === currentRole) || ROLES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition shadow-sm ${activeRoleObj.color}`}
        title="Click to toggle user role"
      >
        <span>Role: {activeRoleObj.label}</span>
        <span className="text-[10px] opacity-70">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 rounded-xl glass-dropdown p-2 shadow-2xl z-40 border border-slate-700/80">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
              Switch Role View
            </div>
            {ROLES.map(role => (
              <button
                key={role.id}
                onClick={() => {
                  setCurrentRole(role.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition font-medium ${
                  role.id === currentRole
                    ? 'bg-indigo-600/30 text-white font-bold border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{role.label}</span>
                {role.id === currentRole && <span className="text-amber-400 font-bold">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
