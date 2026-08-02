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
    // Play Web Audio Welcome Chime sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 note
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.3); // E5 note
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in-95 duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl border-2 border-emerald-500/60 shadow-2xl p-8 text-center space-y-4 bg-gradient-to-b from-indigo-950/80 to-slate-950 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-emerald-500 mx-auto flex items-center justify-center text-slate-950 font-bold text-3xl shadow-xl">
          ✓
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            {t.checkInConfirmed}
          </span>
          <h2 className="font-display font-bold text-3xl text-white mt-3">
            {t.welcomeToChurch}, {member.first_name}!
          </h2>
          <p className="text-sm text-slate-300 mt-2 font-medium">
            We are blessed to worship with you today at Fountain Gate Chapel.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
          <p className="font-bold text-amber-300">{member.cell_group}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Attendance Recorded for Today's Service</p>
        </div>

        <button
          onClick={onDismiss}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          {t.nextMember}
        </button>
      </div>
    </div>
  );
};
