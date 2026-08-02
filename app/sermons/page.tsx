'use client';

import React from 'react';

export default function SermonsPage() {
  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
          Sermon & Media Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Anointing messages, live broadcasts, and audio sermon archives from Rev. Eastwood Anaba.
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-900 via-indigo-850 to-indigo-950 text-white text-center space-y-4 shadow-xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center font-bold text-2xl mx-auto shadow-inner">
          🎧
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
            COMING SOON
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
            Digital Anointing Media Hub
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto leading-relaxed">
            We are currently building our high-definition digital audio message library and live broadcasting suite. Stay tuned!
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
          <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-indigo-100 font-semibold">
            📅 Sunday Anointing Service: <span className="text-amber-300 font-bold">8:30 AM GMT</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-indigo-100 font-semibold">
            📖 Mid-Week Teaching Service: <span className="text-amber-300 font-bold">6:00 PM GMT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
