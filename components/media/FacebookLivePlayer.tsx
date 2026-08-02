'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const FacebookLivePlayer: React.FC = () => {
  const { isLive } = useChurch();

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">Facebook Live Broadcast Hub</h4>
          <p className="text-xs text-slate-500">Live Sunday Service & Special Anointing Services Stream</p>
        </div>

        {isLive ? (
          <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-bold text-xs animate-pulse">
            LIVE BROADCAST ACTIVE
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200">
            Offline / Standby
          </span>
        )}
      </div>

      {/* Embedded Stream Card */}
      <div className="aspect-video w-full rounded-2xl bg-slate-900 overflow-hidden relative shadow-md flex flex-col items-center justify-center text-center p-6 text-white">
        {isLive ? (
          <div className="space-y-3">
            <span className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold text-lg animate-pulse">
              ●
            </span>
            <h5 className="font-display font-bold text-xl text-white">Fountain Gate Chapel Live Stream</h5>
            <p className="text-xs text-slate-300 max-w-sm">
              Live broadcast in progress. Facebook Video Embed active for global satellite campuses.
            </p>
            <div className="pt-2">
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs">
                1,420 Online Viewers
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 mx-auto flex items-center justify-center font-bold text-lg">
              FGC
            </div>
            <h5 className="font-display font-bold text-lg text-slate-200">No Live Stream Currently Active</h5>
            <p className="text-xs text-slate-400 max-w-sm">
              Join us live every Sunday at 8:30 AM GMT or Thursday at 6:30 PM GMT for Mid-week Power Service.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
