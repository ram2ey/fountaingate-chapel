'use client';

import React from 'react';
import Link from 'next/link';
import { useChurch } from '../../lib/context/ChurchContext';

export const MemberDashboard: React.FC = () => {
  const { currentUser, sermons, prayerRequests } = useChurch();

  const latestSermon = sermons[0];
  const activePrayers = prayerRequests.filter(r => r.status === 'active').slice(0, 3);

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            Fountain Gate Chapel Member Portal
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome, {currentUser?.full_name || 'Beloved Member'}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
            Grace and peace be multiplied unto you. Access online giving, community prayer requests, digital sermon messages, and church brethren contacts.
          </p>
        </div>
      </div>

      {/* Quick Action Touch Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Link
          href="/giving"
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200 hover:shadow-md transition text-left space-y-1.5"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            💸
          </div>
          <p className="font-bold text-slate-900 text-sm">Online Giving</p>
          <p className="text-[11px] text-slate-500">Tithes, Offerings & Seeds</p>
        </Link>

        <Link
          href="/prayer-wall"
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-200 hover:shadow-md transition text-left space-y-1.5"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🙏
          </div>
          <p className="font-bold text-slate-900 text-sm">Prayer Wall</p>
          <p className="text-[11px] text-slate-500">Post & Intercede</p>
        </Link>

        <Link
          href="/sermons"
          className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/70 border border-indigo-200 hover:shadow-md transition text-left space-y-1.5"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🎧
          </div>
          <p className="font-bold text-slate-900 text-sm">Sermon Hub</p>
          <p className="text-[11px] text-slate-500">Listen & Stream</p>
        </Link>

        <Link
          href="/members"
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/70 border border-purple-200 hover:shadow-md transition text-left space-y-1.5"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            👥
          </div>
          <p className="font-bold text-slate-900 text-sm">Brethren Directory</p>
          <p className="text-[11px] text-slate-500">Connect & Fellowship</p>
        </Link>
      </div>

      {/* Featured Sermon & Community Prayer Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Latest Sermon Highlight */}
        {latestSermon && (
          <div className="glass-panel p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                Latest Anointing Message
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">{latestSermon.sermon_date}</span>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">{latestSermon.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{latestSermon.speaker} • {latestSermon.scripture_reference}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/sermons"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition"
              >
                Listen Audio Message →
              </Link>
            </div>
          </div>
        )}

        {/* Community Prayer Feed */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-display font-bold text-sm text-slate-900">Community Prayer Requests</h4>
            <Link href="/prayer-wall" className="text-xs font-bold text-indigo-600 hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-2.5">
            {activePrayers.map(req => (
              <div key={req.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900">{req.title}</span>
                  <span className="text-[10px] text-amber-700">🙏 {req.prayed_count} prayed</span>
                </div>
                <p className="text-slate-500 text-[11px] line-clamp-1">{req.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
