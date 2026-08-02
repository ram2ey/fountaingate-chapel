'use client';

import React from 'react';
import Link from 'next/link';
import { useChurch } from '../../lib/context/ChurchContext';
import { RoleBadge } from './RoleBadge';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Header: React.FC = () => {
  const { isLive, searchQuery, setSearchQuery, currentUser, logout } = useChurch();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-3 transition-all shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Brand Name & Search */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              FGC
            </div>
            <span className="font-display font-extrabold text-sm text-slate-900 hidden xs:inline">
              Fountain Gate Chapel
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members, phone..."
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Right Side: Live Indicator, Language, Role Badge & Account controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          {/* Live Alert Banner */}
          {isLive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-live-pulse" />
              <span className="uppercase text-[10px] sm:text-xs">LIVE</span>
            </div>
          )}

          {/* Entrance Tablet Kiosk Button */}
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

          {/* Settings & Logout */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <Link
              href="/settings"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              title="User Account Settings"
            >
              Settings
            </Link>

            {currentUser ? (
              <button
                onClick={logout}
                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition"
              >
                Log Out
              </button>
            ) : (
              <Link
                href="/login"
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
