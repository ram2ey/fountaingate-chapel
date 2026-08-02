'use client';

import React from 'react';
import Link from 'next/link';
import { useChurch } from '../../lib/context/ChurchContext';

export const MemberDashboard: React.FC = () => {
  const { currentUser, prayerRequests } = useChurch();

  const activePrayers = prayerRequests.filter(r => r.status === 'active').slice(0, 3);

  return (
    <div className="space-y-6 pb-8">
      {/* High-Contrast Welcome & Scripture Banner (No Pill Tag) */}
      <div className="glass-panel p-6 sm:p-8 rounded-none border border-indigo-200 bg-indigo-50/80 shadow-md space-y-3 relative overflow-hidden">
        <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Welcome, {currentUser?.full_name || 'Beloved Member'}!
        </h1>

        <div className="p-4 rounded-none bg-white border border-indigo-100 shadow-xs space-y-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-800 italic leading-relaxed">
            "The LORD bless you and keep you; the LORD make His face shine upon you and be gracious to you; the LORD turn His face toward you and give you peace."
          </p>
          <p className="text-[11px] font-extrabold text-indigo-700 text-right uppercase tracking-wider">
            — Numbers 6:24-26
          </p>
        </div>
      </div>

      {/* Quick Action Touch Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Link
          href="/giving"
          className="p-4 rounded-none bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200 hover:shadow-md transition text-left space-y-1.5"
        >
          <div className="w-10 h-10 rounded-none bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            💸
          </div>
          <p className="font-bold text-slate-900 text-sm">Online Giving</p>
          <p className="text-[11px] text-slate-500">Tithes, Offerings & Seeds</p>
        </Link>

        <Link
          href="/prayer-wall"
          className="p-4 rounded-none bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-200 hover:shadow-md transition text-left space-y-1.5"
        >
          <div className="w-10 h-10 rounded-none bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🙏
          </div>
          <p className="font-bold text-slate-900 text-sm">Prayer Wall</p>
          <p className="text-[11px] text-slate-500">Post & Intercede</p>
        </Link>

        <Link
          href="/members"
          className="p-4 rounded-none bg-gradient-to-br from-purple-50 to-purple-100/70 border border-purple-200 hover:shadow-md transition text-left space-y-1.5"
        >
          <div className="w-10 h-10 rounded-none bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            👥
          </div>
          <p className="font-bold text-slate-900 text-sm">Brethren Directory</p>
          <p className="text-[11px] text-slate-500">Connect & Fellowship</p>
        </Link>

        <Link
          href="/sermons"
          className="p-4 rounded-none bg-gradient-to-br from-indigo-50 to-indigo-100/70 border border-indigo-200 hover:shadow-md transition text-left space-y-1.5"
        >
          <div className="w-10 h-10 rounded-none bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🎧
          </div>
          <p className="font-bold text-slate-900 text-sm">Sermon Hub</p>
          <p className="text-[11px] text-slate-500">Media Messages</p>
        </Link>
      </div>

      {/* Community Prayer Highlights */}
      <div className="glass-panel p-5 sm:p-6 rounded-none border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">Community Prayer Requests & Intercession</h3>
            <p className="text-xs text-slate-500">Stand in faith with your Fountain Gate Chapel family</p>
          </div>
          <Link href="/prayer-wall" className="text-xs font-bold text-indigo-600 hover:underline">
            View Prayer Wall →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activePrayers.map(req => (
            <div key={req.id} className="p-4 rounded-none bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-900 truncate">{req.title}</span>
                <span className="text-[10px] text-amber-700 shrink-0">🙏 {req.prayed_count} prayed</span>
              </div>
              <p className="text-slate-500 text-[11px] line-clamp-2">{req.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
