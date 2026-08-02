'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { SelfServeCheckIn } from '../../components/kiosk/SelfServeCheckIn';
import { WelcomeToastModal } from '../../components/kiosk/WelcomeToastModal';
import { Member } from '../../lib/types/church';

export default function KioskPage() {
  const { isOnline, pendingOfflineCount, syncOfflineCheckIns } = useChurch();
  const [checkedInMember, setCheckedInMember] = useState<Member | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Network Status Pill */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition ${
          isOnline
            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
            : 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>{isOnline ? 'Connected' : 'Offline Mode Mode'}</span>
        </div>

        {pendingOfflineCount > 0 && (
          <button
            onClick={syncOfflineCheckIns}
            className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-200 transition"
            title="Click to sync offline cached check-ins to server"
          >
            <span>Sync {pendingOfflineCount} Cached</span>
          </button>
        )}
      </div>

      {/* Kiosk Header */}
      <div className="text-center space-y-2 relative z-10 pt-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-white font-bold text-base shadow-lg">
          FGC
        </div>
        <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-slate-900 tracking-tight">
          Welcome to Fountain Gate Chapel
        </h1>
        <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
          FOUNTAIN GATE CHAPEL • Sunday Attendance Kiosk
        </p>
      </div>

      {/* Kiosk Body */}
      <div className="my-auto relative z-10 py-6">
        <SelfServeCheckIn onCheckInSuccess={(member) => setCheckedInMember(member)} />
      </div>

      {/* Kiosk Footer */}
      <div className="text-center text-xs text-slate-500 relative z-10">
        <p className="font-semibold">First time at Fountain Gate Chapel? Ask an usher for a Welcome Connect Card.</p>
      </div>

      {/* Welcome Toast Modal */}
      {checkedInMember && (
        <WelcomeToastModal
          member={checkedInMember}
          onDismiss={() => setCheckedInMember(null)}
        />
      )}
    </div>
  );
};
