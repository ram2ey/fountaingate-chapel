'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { BranchSwitcher } from './BranchSwitcher';
import { RoleBadge } from './RoleBadge';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Header: React.FC = () => {
  const { isLive, searchQuery, setSearchQuery } = useChurch();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-3 transition-all shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Branch Switcher & Mobile Search */}
        <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-start">
          <BranchSwitcher />

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members, phone..."
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Right Side: Live Indicator, Language, Role Badge & Profile */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          {/* Live Alert Banner */}
          {isLive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-live-pulse" />
              <span className="uppercase text-[10px] sm:text-xs">LIVE</span>
            </div>
          )}

          {/* Tablet Kiosk Button */}
          <a
            href="/kiosk"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
            title="Launch Entrance Tablet Kiosk Mode"
          >
            <span>Kiosk</span>
          </a>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Role Badge */}
          <RoleBadge />

          {/* User Profile */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
              EA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
