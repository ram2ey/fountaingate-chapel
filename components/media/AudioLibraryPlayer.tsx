'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Sermon } from '../../lib/types/church';

export const AudioLibraryPlayer: React.FC = () => {
  const { sermons } = useChurch();
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(sermons[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h4 className="font-display font-bold text-base text-slate-900">Audio Sermon Archive</h4>
        <p className="text-xs text-slate-500">Listen & stream MP3 audio messages on mobile devices</p>
      </div>

      {/* Audio Player Widget */}
      {currentSermon && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase">
                {currentSermon.series || 'Special Sermon'}
              </span>
              <h5 className="font-display font-bold text-lg text-white mt-1">{currentSermon.title}</h5>
              <p className="text-xs text-indigo-200 font-medium">Speaker: {currentSermon.speaker} • {currentSermon.scripture_reference}</p>
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base flex items-center justify-center shadow-lg transition shrink-0"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-indigo-950 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full bg-amber-400 transition-all duration-300 ${isPlaying ? 'w-1/2' : 'w-0'}`} />
            </div>
            <div className="flex justify-between text-[10px] text-indigo-300 font-medium">
              <span>{isPlaying ? '14:20' : '00:00'}</span>
              <span>45:00</span>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Grid */}
      <div className="space-y-2">
        <h5 className="font-bold text-slate-800 text-xs">Recent Sermon Messages ({sermons.length})</h5>
        {sermons.map((sermon) => (
          <div
            key={sermon.id}
            onClick={() => {
              setCurrentSermon(sermon);
              setIsPlaying(true);
            }}
            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              currentSermon?.id === sermon.id
                ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div>
              <p className="font-bold text-xs">{sermon.title}</p>
              <p className="text-[10px] text-slate-500">{sermon.speaker} • {sermon.sermon_date}</p>
            </div>
            <span className="text-xs text-indigo-600 font-bold">Listen ▶</span>
          </div>
        ))}
      </div>
    </div>
  );
};
