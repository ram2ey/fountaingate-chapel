'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChurch } from '../../lib/context/ChurchContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentRole, members, currentBranch } = useChurch();

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
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-indigo-900 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-950/50">
            FGC
          </div>
          <div>
            <h1 className="font-display font-bold text-sm text-slate-100 leading-tight">FOUNTAIN GATE</h1>
            <p className="text-[10px] tracking-wider font-semibold text-amber-400 uppercase">Chapel Management</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Modules & Ecosystem
          </div>

          {NAV_ITEMS.map((item) => {
            const isAllowed = item.roles.includes(currentRole);
            const isActive = pathname === item.href;

            if (!isAllowed) return null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-md shadow-indigo-900/40 border border-indigo-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Campus Status</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Active
          </span>
        </div>
        <p className="font-semibold text-slate-200 text-[11px] truncate">{currentBranch.name}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{members.length} Registered Members</p>
      </div>
    </aside>
  );
};
