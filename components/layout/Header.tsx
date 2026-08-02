'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { BranchSwitcher } from './BranchSwitcher';
import { RoleBadge } from './RoleBadge';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Header: React.FC = () => {
  const { isLive, searchQuery, setSearchQuery } = useChurch();

  return (
    <header className="sticky top-0 z-20 glass-panel border-b border-slate-800 px-4 lg:px-8 py-3 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Branch Switcher & Search */}
        <div className="flex items-center gap-4">
          <BranchSwitcher />

          {/* Search Bar */}
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members, phone, sermons..."
              className="w-full bg-slate-900/90 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right Side: Live Indicator, Role Badge, Kiosk Link & Profile */}
        <div className="flex items-center gap-3">
          {/* Live Alert Banner */}
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-live-pulse" />
              <span className="hidden sm:inline uppercase">LIVE SERVICE ON AIR</span>
            </div>
          )}

          {/* Tablet Kiosk Button */}
          <a
            href="/kiosk"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition"
            title="Launch Entrance Tablet Kiosk Mode"
          >
            <span>Kiosk Mode</span>
          </a>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Role Badge */}
          <RoleBadge />

          {/* Notifications */}
          <button className="relative px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold">
            <span>Alerts</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">1</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
              EA
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-none">Rev. Dr. Eastwood Anaba</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Senior Overseer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
