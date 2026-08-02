'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { SelfServeCheckIn } from '../../components/kiosk/SelfServeCheckIn';
import { WelcomeToastModal } from '../../components/kiosk/WelcomeToastModal';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { Member } from '../../lib/types/church';

export default function KioskPage() {
  const { currentBranch, isOnline, pendingOfflineCount, syncOfflineCheckIns, t } = useChurch();
  const [checkedInMember, setCheckedInMember] = useState<Member | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Network Status & Language Switcher Pill */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LanguageSwitcher />

        <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition ${
          isOnline
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          <span>{isOnline ? 'Network Connected' : 'Offline Mode'}</span>
        </div>

        {pendingOfflineCount > 0 && (
          <button
            onClick={syncOfflineCheckIns}
            className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition"
            title="Click to sync offline cached check-ins to server"
          >
            <span>Sync {pendingOfflineCount} Cached</span>
          </button>
        )}
      </div>

      {/* Kiosk Header */}
      <div className="text-center space-y-2 relative z-10 pt-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-600 to-indigo-900 mx-auto flex items-center justify-center text-white font-bold text-sm shadow-lg">
          FGC
        </div>
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-white tracking-tight">
          {t.welcomeHeader}
        </h1>
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
          {currentBranch.name} • {t.subHeaderKiosk}
        </p>
      </div>

      {/* Kiosk Body */}
      <div className="my-auto relative z-10 py-6">
        <SelfServeCheckIn onCheckInSuccess={(member) => setCheckedInMember(member)} />
      </div>

      {/* Kiosk Footer */}
      <div className="text-center text-xs text-slate-500 relative z-10">
        <p className="font-medium">First Time Guest? Visit the Welcome Desk or scan QR for Guest Intake</p>
        <p className="text-[10px] text-slate-600 mt-0.5">Fountain Gate Chapel PWA Kiosk Mode • Auto Offline Caching</p>
      </div>

      {/* Welcome Modal */}
      {checkedInMember && (
        <WelcomeToastModal
          member={checkedInMember}
          onDismiss={() => setCheckedInMember(null)}
        />
      )}
    </div>
  );
}
