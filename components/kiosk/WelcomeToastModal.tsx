'use client';

import React, { useEffect } from 'react';
import { Member } from '../../lib/types/church';

interface Props {
  member: Member;
  onDismiss: () => void;
}

export const WelcomeToastModal: React.FC<Props> = ({ member, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl font-bold shadow-md animate-bounce">
          ✓
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
            CHECK-IN CONFIRMED
          </span>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 mt-2">
            Welcome to Service, {member.first_name}!
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            God bless you for worshiping at Fountain Gate Chapel today. Have a blessed and impactful service!
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
          <p className="font-bold">{member.cell_group}</p>
          <p className="text-[11px] text-slate-500">Welcome to Church</p>
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
        >
          Done
        </button>
      </div>
    </div>
  );
};
