'use client';

import React, { useState } from 'react';
import { AtRiskQueue } from '../../components/care/AtRiskQueue';
import { ConfidentialCareLog } from '../../components/care/ConfidentialCareLog';
import { MilestonesCalendar } from '../../components/care/MilestonesCalendar';
import { RapidCheckInModal } from '../../components/care/RapidCheckInModal';

export default function PastoralCarePage() {
  const [showCheckIn, setShowCheckIn] = useState(false);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Pastoral Care & Member Retention
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated at-risk member identification, confidential counseling logs, and birthday felicitations.
          </p>
        </div>

        <button
          onClick={() => setShowCheckIn(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
        >
          + Rapid Attendance Check-In
        </button>
      </div>

      <AtRiskQueue />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConfidentialCareLog />
        <MilestonesCalendar />
      </div>

      {showCheckIn && <RapidCheckInModal onClose={() => setShowCheckIn(false)} />}
    </div>
  );
}
