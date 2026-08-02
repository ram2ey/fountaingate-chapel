'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChurch } from '../../lib/context/ChurchContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentRole, members, currentUser } = useChurch();

  const atRiskCount = members.filter(m => m.status === 'at_risk').length;

  const NAV_ITEMS = [
    { label: 'Dashboard Overview', href: '/', roles: ['admin', 'pastor'] },
    { label: 'Member Directory', href: '/members', roles: ['admin', 'pastor'] },
    { label: 'Pastoral Care & At-Risk', href: '/pastoral-care', badge: atRiskCount > 0 ? atRiskCount : undefined, roles: ['admin', 'pastor'] },
    { label: 'Prayer Wall & Testimonies', href: '/prayer-wall', roles: ['admin', 'pastor', 'member'] },
    { label: 'Sermon & Media Hub', href: '/sermons', roles: ['admin', 'pastor', 'member'] },
    { label: 'WhatsApp & SMS Broadcast', href: '/communications', roles: ['admin', 'pastor'] },
    { label: 'Financials & Tithe Ledger', href: '/financials', roles: ['admin'] },
    { label: 'Tablet Entrance Kiosk', href: '/kiosk', roles: ['admin', 'pastor'] },
    { label: 'Guest Intake Form (QR)', href: '/guest-intake', roles: ['admin', 'pastor', 'member'] },
    { label: 'Admin Management Panel', href: '/admin', roles: ['admin'] },
    { label: 'User Account Settings', href: '/settings', roles: ['admin', 'pastor', 'member'] },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0 h-screen sticky top-0 shadow-sm">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            FGC
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm text-slate-900 leading-tight">FOUNTAIN GATE</h1>
            <p className="text-[10px] tracking-wider font-semibold text-amber-600 uppercase">Chapel Management</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
      </div>

      {/* Footer User Info */}
      <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Active User</span>
          <span className="text-[10px] font-bold text-indigo-700 uppercase">{currentRole}</span>
        </div>
        <p className="font-bold text-slate-900 text-xs truncate">{currentUser?.full_name || 'FGC Leader'}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{currentUser?.phone || '+233 244 000 111'}</p>
      </div>
    </aside>
  );
};
