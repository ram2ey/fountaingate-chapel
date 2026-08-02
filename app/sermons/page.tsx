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

      {/* High-Contrast Coming Soon Banner with Scripture */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-indigo-200 bg-indigo-50/90 text-center space-y-4 shadow-md relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
          🎧
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs">
            COMING SOON
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight">
            Digital Anointing Media Hub
          </h2>
          
          <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs max-w-xl mx-auto space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-slate-800 italic leading-relaxed">
              "So then faith comes by hearing, and hearing by the word of God."
            </p>
            <p className="text-[11px] font-extrabold text-indigo-700 text-right uppercase tracking-wider">
              — Romans 10:17
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
          <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
            📅 Sunday Anointing Service: <span className="text-indigo-700 font-bold">8:30 AM GMT</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
            📖 Mid-Week Teaching Service: <span className="text-indigo-700 font-bold">6:00 PM GMT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
