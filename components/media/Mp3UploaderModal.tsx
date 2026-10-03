'use client';

interface Props { onClose: () => void; }

export function Mp3UploaderModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <section role="dialog" aria-modal="true" aria-labelledby="audio-unavailable-title" className="bg-white p-6 max-w-md space-y-4">
        <h2 id="audio-unavailable-title" className="font-display font-bold text-lg">Audio uploads unavailable</h2>
        <p className="text-sm text-slate-600">Sermon audio uploads are currently unavailable.</p>
        <button type="button" onClick={onClose} className="bg-indigo-600 text-white px-4 py-2">Close</button>
      </section>
    </div>
  );
}
