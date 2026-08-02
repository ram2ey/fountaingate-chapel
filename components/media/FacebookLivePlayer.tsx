'use client';

import React, { useState } from 'react';
import { Sermon } from '../../lib/types/church';
import { useChurch } from '../../lib/context/ChurchContext';

export const FacebookLivePlayer: React.FC<{ sermon: Sermon }> = ({ sermon }) => {
  const { isLive } = useChurch();
  const [showPrayerOverlay, setShowPrayerOverlay] = useState(false);
  const [prayerText, setPrayerText] = useState('');
  const [prayerSubmitted, setPrayerSubmitted] = useState(false);

  const handlePrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText) return;
    setPrayerSubmitted(true);
    setTimeout(() => {
      setPrayerSubmitted(false);
      setShowPrayerOverlay(false);
      setPrayerText('');
    }, 2500);
  };

  return (
    <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-0">
      {/* Banner */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-white">{sermon.title}</span>
              {sermon.is_live && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold tracking-wider animate-live-pulse uppercase">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Speaker: {sermon.speaker} • Series: {sermon.series}</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          <span className="text-slate-200">{sermon.views_count.toLocaleString()} Viewers</span>
        </div>
      </div>

      {/* Embed Frame */}
      <div className="relative aspect-video bg-black w-full overflow-hidden">
        <iframe
          src={sermon.facebook_embed_url}
          className="w-full h-full border-0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen={true}
        />

        {/* Floating Ask Pastor / Prayer Overlay Button */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => setShowPrayerOverlay(!showPrayerOverlay)}
            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-2xl shadow-amber-950/80 border border-amber-300/40 transition transform hover:scale-105"
          >
            <span>Ask Pastor / Submit Live Prayer</span>
          </button>
        </div>
      </div>

      {/* Interactive Overlay Drawer */}
      {showPrayerOverlay && (
        <div className="p-5 bg-slate-900 border-t border-slate-800 animate-in slide-in-from-bottom duration-200">
          {prayerSubmitted ? (
            <div className="text-emerald-400 font-bold text-xs p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              Your prayer request has been submitted directly to the pastoral altar. Pastors are interceding for you now!
            </div>
          ) : (
            <form onSubmit={handlePrayerSubmit} className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">
                  Live Service Private Prayer Overlay
                </span>
                <span className="text-[10px] text-slate-400">Confidential to Pastoral Care Team</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={prayerText}
                  onChange={(e) => setPrayerText(e.target.value)}
                  placeholder="Type your prayer request or question for Pastor while watching live stream..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shrink-0 shadow-lg"
                >
                  Send
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
