'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { FacebookLivePlayer } from '../../components/media/FacebookLivePlayer';
import { AudioLibraryPlayer } from '../../components/media/AudioLibraryPlayer';
import { Mp3UploaderModal } from '../../components/media/Mp3UploaderModal';

export default function SermonsPage() {
  const { sermons } = useChurch();
  const [showUploader, setShowUploader] = useState(false);

  const liveSermon = sermons.find(s => s.is_live) || sermons[0];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Sermon & Media Ecosystem</h2>
          <p className="text-xs text-slate-400 mt-1">
            Facebook Live auto-embed player with interactive prayer overlay, on-demand MP3 library, and background audio streaming.
          </p>
        </div>
      </div>

      {/* Facebook Live Section */}
      {liveSermon && <FacebookLivePlayer sermon={liveSermon} />}

      {/* Audio Library Section */}
      <AudioLibraryPlayer onOpenUploader={() => setShowUploader(true)} />

      {/* Uploader Modal */}
      {showUploader && <Mp3UploaderModal onClose={() => setShowUploader(false)} />}
    </div>
  );
}
