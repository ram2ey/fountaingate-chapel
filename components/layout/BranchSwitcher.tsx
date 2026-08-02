'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const BranchSwitcher: React.FC = () => {
  const { currentBranch, setCurrentBranch, branches } = useChurch();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/60 transition text-sm font-medium text-slate-200 shadow-sm"
      >
        <span className={`w-2 h-2 rounded-full ${currentBranch.is_main_campus ? 'bg-amber-400' : 'bg-indigo-400'}`} />
        <span className="max-w-[160px] truncate">{currentBranch.name}</span>
        <span className="text-xs text-slate-400 ml-1">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-xl glass-dropdown p-1.5 shadow-2xl z-40 border border-slate-700/80 animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              Campus / Branch Selector
            </div>
            <div className="mt-1 space-y-0.5">
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => {
                    setCurrentBranch(branch);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    branch.id === currentBranch.id
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${branch.is_main_campus ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                    <div className="text-left">
                      <p className="font-semibold leading-none">{branch.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{branch.location}</p>
                    </div>
                  </div>
                  {branch.id === currentBranch.id && <span className="text-indigo-400 font-bold text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
