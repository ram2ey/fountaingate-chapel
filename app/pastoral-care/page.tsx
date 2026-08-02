'use client';

import React, { useState } from 'react';
import { AtRiskQueue } from '../../components/care/AtRiskQueue';
import { ConfidentialCareLog } from '../../components/care/ConfidentialCareLog';
import { MilestonesCalendar } from '../../components/care/MilestonesCalendar';
import { RapidCheckInModal } from '../../components/care/RapidCheckInModal';

export default function PastoralCarePage() {
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Proactive Pastoral Care & Shepherding</h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated "At-Risk" member flagging engine, confidential counseling logs, and care milestone reminders.
          </p>
        </div>

        <button
          onClick={() => setShowCheckInModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-900/50 shrink-0"
        >
          <span>Rapid Service Check-In</span>
        </button>
      </div>

      <AtRiskQueue />
      <ConfidentialCareLog />
      <MilestonesCalendar />

      {showCheckInModal && <RapidCheckInModal onClose={() => setShowCheckInModal(false)} />}
    </div>
  );
}
