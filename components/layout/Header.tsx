'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChurch } from '../../lib/context/ChurchContext';
import { RoleBadge } from './RoleBadge';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { isLive, searchQuery, setSearchQuery, currentUser, logout, currentRole, members } = useChurch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const atRiskCount = members.filter(m => m.status === 'at_risk').length;

  const NAV_ITEMS = [
    { label: 'Dashboard Overview', href: '/', roles: ['admin', 'pastor'] },
    { label: 'Member Directory', href: '/members', roles: ['admin', 'pastor'] },
    { label: 'Pastoral Care & At-Risk', href: '/pastoral-care', badge: atRiskCount > 0 ? atRiskCount : undefined, roles: ['admin', 'pastor'] },
    { label: 'Sermon & Media Hub', href: '/sermons', roles: ['admin', 'pastor', 'member'] },
    { label: 'WhatsApp & SMS Broadcast', href: '/communications', roles: ['admin', 'pastor'] },
    { label: 'Financials & Tithe Ledger', href: '/financials', roles: ['admin'] },
    { label: 'Tablet Entrance Kiosk', href: '/kiosk', roles: ['admin', 'pastor'] },
    { label: 'Guest Intake Form (QR)', href: '/guest-intake', roles: ['admin', 'pastor', 'member'] },
    { label: 'Admin Management Panel', href: '/admin', roles: ['admin'] },
    { label: 'User Account Settings', href: '/settings', roles: ['admin', 'pastor', 'member'] },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-3 transition-all shadow-sm">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Brand Name & Search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0 md:hidden">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              FGC
            </div>
            <span className="font-display font-extrabold text-sm text-slate-900 hidden xs:inline">
              FGC
            </span>
          </Link>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Right Side: Live Indicator, Role Badge & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Live Alert Banner */}
          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-live-pulse" />
              <span className="uppercase text-[10px] hidden sm:inline">LIVE</span>
            </div>
          )}

          {/* Entrance Kiosk Pill */}
          <a
            href="/kiosk"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
          >
            <span>Kiosk</span>
          </a>

          {/* Role Badge */}
          <RoleBadge />

          {/* Settings Link on Desktop */}
          <Link
            href="/settings"
            className="hidden md:inline-flex p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            title="User Account Settings"
          >
            Settings
          </Link>

          {/* Log Out Button on Desktop */}
          {currentUser ? (
            <button
              onClick={logout}
              className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition"
            >
              Log Out
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Log In
            </Link>
          )}

          {/* Hamburger Menu Toggle Button (Mobile & Tablet ONLY - Hidden on Desktop) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-base font-bold transition flex items-center justify-center border border-slate-200"
            title="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Hamburger Navigation Drawer Modal (Mobile & Tablet ONLY - Hidden on Desktop) */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-3 top-14 z-50 w-72 rounded-3xl bg-white border border-slate-200 shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
              <div>
                <p className="font-display font-extrabold text-sm text-slate-900">Fountain Gate Chapel</p>
                <p className="text-[10px] text-amber-700 font-bold uppercase">{currentRole} Navigation</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
              {NAV_ITEMS.map((item) => {
                const isAllowed = item.roles.includes(currentRole);
                const isActive = pathname === item.href;

                if (!isAllowed) return null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-md'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs px-1">
              <span className="text-[11px] text-slate-500 truncate max-w-[150px]">{currentUser?.full_name || 'FGC Leader'}</span>
              {currentUser ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200"
                >
                  Log Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px]"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
