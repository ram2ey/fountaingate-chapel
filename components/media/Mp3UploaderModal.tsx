'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const Mp3UploaderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addSermon, currentBranch } = useChurch();

  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('Rev. Dr. Eastwood Anaba');
  const [series, setSeries] = useState('Kingdom Expansion 2026');
  const [scripture, setScripture] = useState('Acts 1:8');
  const [audioUrl, setAudioUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3');
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !speaker) return;

    const today = new Date().toISOString().split('T')[0];

    addSermon({
      branch_id: currentBranch.id,
      title,
      speaker,
      series: series || undefined,
      scripture_reference: scripture || undefined,
      sermon_date: today,
      audio_storage_url: audioUrl,
      facebook_embed_url: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Ffacebook%2Fvideos%2F10153231379946729%2F&show_text=false&width=560',
      is_live: false
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-bold">
          ✕
        </button>

        <div className="mb-4">
          <h3 className="font-display font-bold text-lg text-white">Upload Sermon MP3 Audio</h3>
          <p className="text-xs text-slate-400">Direct drag-and-drop to Supabase Audio Storage</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Drag and Drop Zone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-900/60 transition cursor-pointer relative">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileDrop}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <p className="font-bold text-slate-200">
              {fileName ? `Selected: ${fileName}` : 'Click or Drag MP3 Audio File Here'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Supports MP3, AAC, M4A up to 100MB</p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Sermon Message Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Anointing for Dominion"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Preacher / Speaker *</label>
              <input
                type="text"
                required
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sermon Series</label>
              <input
                type="text"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Scripture Reference</label>
            <input
              type="text"
              value={scripture}
              onChange={(e) => setScripture(e.target.value)}
              placeholder="e.g. Isaiah 43:18-19"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-900/50"
            >
              Publish MP3 Sermon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
