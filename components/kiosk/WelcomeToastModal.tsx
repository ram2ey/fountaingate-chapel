'use client';

import React, { useEffect } from 'react';
import { Member } from '../../lib/types/church';
import { useChurch } from '../../lib/context/ChurchContext';

interface Props {
  member: Member;
  onDismiss: () => void;
}

export const WelcomeToastModal: React.FC<Props> = ({ member, onDismiss }) => {
  const { t } = useChurch();

  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio chime auto-play bypassed');
    }

    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border-2 border-emerald-500 shadow-2xl p-8 text-center space-y-4 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500 text-white mx-auto flex items-center justify-center font-bold text-3xl shadow-xl">
          ✓
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            {t.checkInConfirmed}
          </span>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 mt-3">
            {t.welcomeToChurch}, {member.first_name}!
          </h2>
          <p className="text-sm text-slate-600 mt-2 font-medium">
            We are blessed to worship with you today at Fountain Gate Chapel.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <p className="font-bold text-indigo-700">{member.cell_group}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Attendance Recorded for Today's Service</p>
        </div>

        <button
          onClick={onDismiss}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition"
        >
          {t.nextMember}
        </button>
      </div>
    </div>
  );
};
