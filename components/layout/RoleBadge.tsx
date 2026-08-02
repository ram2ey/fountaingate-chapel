'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { UserRole } from '../../lib/types/church';

const ROLES: { id: UserRole; label: string; color: string }[] = [
  { id: 'admin', label: 'Admin', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'pastor', label: 'Pastor', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'member', label: 'Member', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
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
          <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-dropdown p-2 shadow-2xl z-40 border border-slate-200">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
              Switch Role View
            </div>
            {ROLES.map(role => (
              <button
                key={role.id}
                onClick={() => {
                  setCurrentRole(role.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition font-medium ${
                  role.id === currentRole
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{role.label}</span>
                {role.id === currentRole && <span className="text-amber-600 font-bold">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
