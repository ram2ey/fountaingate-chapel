'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Language, LANGUAGE_LABELS } from '../../lib/translations';

export const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setCurrentLanguage } = useChurch();
  const [isOpen, setIsOpen] = useState(false);

  const activeLangObj = LANGUAGE_LABELS[currentLanguage] || LANGUAGE_LABELS.en;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/60 text-xs font-semibold text-slate-200 transition shadow-sm"
        title="Switch Interface Language (English, Twi, Ewe, Hausa, French)"
      >
        <span>Lang: {activeLangObj.code}</span>
        <span className="text-[10px] opacity-70">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 rounded-xl glass-dropdown p-1.5 shadow-2xl z-40 border border-slate-700/80 animate-in fade-in zoom-in-95">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
              Select Language
            </div>
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map(langKey => (
              <button
                key={langKey}
                onClick={() => {
                  setCurrentLanguage(langKey);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition font-medium ${
                  langKey === currentLanguage
                    ? 'bg-indigo-600/30 text-white font-bold border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{LANGUAGE_LABELS[langKey].label}</span>
                {langKey === currentLanguage && <span className="text-amber-400 font-bold">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
