'use client';

import React, { useState } from 'react';
import { FacebookLivePlayer } from '../../components/media/FacebookLivePlayer';
import { AudioLibraryPlayer } from '../../components/media/AudioLibraryPlayer';
import { Mp3UploaderModal } from '../../components/media/Mp3UploaderModal';

export default function SermonsPage() {
  const [showUploader, setShowUploader] = useState(false);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Sermons & Media Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Facebook Live broadcasting center and mobile MP3 audio sermon library.
          </p>
        </div>

        <button
          onClick={() => setShowUploader(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
        >
          + Upload MP3 Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FacebookLivePlayer />
        <AudioLibraryPlayer />
      </div>

      {showUploader && <Mp3UploaderModal onClose={() => setShowUploader(false)} />}
    </div>
  );
}
