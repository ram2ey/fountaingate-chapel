'use client';

import React, { useState } from 'react';
import { Sermon } from '../../lib/types/church';
import { useChurch } from '../../lib/context/ChurchContext';

export const AudioLibraryPlayer: React.FC<{ onOpenUploader: () => void }> = ({ onOpenUploader }) => {
  const { sermons } = useChurch();

  const [activeAudioSermon, setActiveAudioSermon] = useState<Sermon | null>(sermons[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filterSpeaker, setFilterSpeaker] = useState('all');
  const [search, setSearch] = useState('');

  const filteredSermons = sermons.filter(s => {
    const matchesSearch = 
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.series && s.series.toLowerCase().includes(search.toLowerCase())) ||
      (s.scripture_reference && s.scripture_reference.toLowerCase().includes(search.toLowerCase()));

    const matchesSpeaker = filterSpeaker === 'all' || s.speaker === filterSpeaker;

    return matchesSearch && matchesSpeaker;
  });

  const togglePlay = (sermon: Sermon) => {
    if (activeAudioSermon?.id === sermon.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveAudioSermon(sermon);
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audio messages by title, series, scripture..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={onOpenUploader}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shrink-0"
        >
          <span>+ Upload Audio MP3</span>
        </button>
      </div>

      {/* Sermon List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSermons.map((sermon) => {
          const isCurrent = activeAudioSermon?.id === sermon.id;
          return (
            <div
              key={sermon.id}
              className={`p-5 rounded-2xl border transition shadow-lg flex flex-col justify-between ${
                isCurrent
                  ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border-indigo-500/50 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    {sermon.series || 'Sunday Message'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {sermon.sermon_date}
                  </span>
                </div>

                <h4 className="font-display font-bold text-base text-white leading-tight mt-1">{sermon.title}</h4>
                <p className="text-xs text-slate-300 font-medium mt-1">Speaker: {sermon.speaker}</p>

                {sermon.scripture_reference && (
                  <p className="text-xs text-amber-400 font-semibold mt-2">
                    <span>Scripture: {sermon.scripture_reference}</span>
                  </p>
                )}
              </div>

              {/* Play Button */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">HTML5 Audio Stream</span>
                <button
                  onClick={() => togglePlay(sermon)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                    isCurrent && isPlaying
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isCurrent && isPlaying ? 'Pause Audio' : 'Stream MP3'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky HTML5 Audio Bar */}
      {activeAudioSermon && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 glass-panel p-4 rounded-2xl border border-indigo-500/40 shadow-2xl bg-slate-950/95 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-bottom">
          <div>
            <p className="font-bold text-xs text-white leading-tight">{activeAudioSermon.title}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{activeAudioSermon.speaker} • {activeAudioSermon.scripture_reference}</p>
          </div>

          <div className="flex-1 max-w-md">
            <audio
              src={activeAudioSermon.audio_storage_url}
              controls
              autoPlay={isPlaying}
              className="w-full h-8 rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
