'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { FacebookLivePlayer } from '../../components/media/FacebookLivePlayer';
import { Mp3UploaderModal } from '../../components/media/Mp3UploaderModal';

export default function SermonsPage() {
  const { sermons, toggleLiveSermon, currentRole } = useChurch();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'series'>('all');

  const isPastorOrAdmin = currentRole === 'admin' || currentRole === 'pastor';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Sermon & Media Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Anointing messages by Rev. Eastwood Anaba and live Facebook broadcasts.
          </p>
        </div>

        {/* Hide Upload MP3 button for member role */}
        {isPastorOrAdmin && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
          >
            + Upload MP3 Sermon
          </button>
        )}
      </div>

      {/* Live Stream Player */}
      <FacebookLivePlayer />

      {/* Audio Sermons List */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
          Audio Sermon Archives & Audio Messages
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sermons.map((sermon) => (
            <div key={sermon.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                    {sermon.series || 'Sermon Series'}
                  </span>
                  <h4 className="font-display font-bold text-slate-900 text-sm mt-1">{sermon.title}</h4>
                  <p className="text-xs text-slate-500">{sermon.speaker} • {sermon.scripture_reference}</p>
                </div>

                {isPastorOrAdmin && (
                  <button
                    onClick={() => toggleLiveSermon(sermon.id)}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      sermon.is_live ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {sermon.is_live ? 'LIVE' : 'Set Live'}
                  </button>
                )}
              </div>

              {/* Audio Controls Simulator */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    ▶
                  </button>
                  <span className="text-xs font-semibold text-slate-700">Play Audio Message</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">42:15</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showUploadModal && <Mp3UploaderModal onClose={() => setShowUploadModal(false)} />}
    </div>
  );
}
