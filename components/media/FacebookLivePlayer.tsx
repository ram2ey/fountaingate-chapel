'use client';

import React from 'react';

export const FacebookLivePlayer: React.FC = () => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">Facebook Live Broadcast Hub</h4>
          <p className="text-xs text-slate-500">Live Sunday Service & Special Anointing Services Stream</p>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200">
          COMING SOON
        </span>
      </div>

      {/* Embedded Stream Card */}
      <div className="aspect-video w-full rounded-2xl bg-gradient-to-tr from-indigo-950 via-indigo-900 to-slate-900 overflow-hidden relative shadow-md flex flex-col items-center justify-center text-center p-6 text-white">
        <div className="space-y-3 max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-bold text-xl mx-auto flex items-center justify-center shadow-lg">
            FGC
          </div>
          <h5 className="font-display font-extrabold text-2xl text-white">Live Broadcast Coming Soon</h5>
          <p className="text-xs text-indigo-100 leading-relaxed font-medium">
            Stay tuned for upcoming live services and special anointing stream broadcasts from Fountain Gate Chapel.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-800/80 text-amber-300 font-bold text-[11px] border border-indigo-700">
              Sunday Service: 8:30 AM GMT
            </span>
            <span className="px-3 py-1 rounded-full bg-indigo-800/80 text-amber-300 font-bold text-[11px] border border-indigo-700">
              Thursday Service: 6:30 PM GMT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
