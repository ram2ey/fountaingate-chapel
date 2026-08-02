'use client';

import React, { useState } from 'react';
import { MetricsOverview } from '../components/dashboard/MetricsOverview';
import { AttendanceChart } from '../components/dashboard/AttendanceChart';
import { FinancialBreakdownChart } from '../components/dashboard/FinancialBreakdownChart';
import { AtRiskInterventionSummary } from '../components/dashboard/AtRiskInterventionSummary';
import { RapidCheckInModal } from '../components/care/RapidCheckInModal';
import { AddMemberModal } from '../components/members/AddMemberModal';
import { useChurch } from '../lib/context/ChurchContext';

export default function DashboardPage() {
  const { isLive, setIsLive, currentRole } = useChurch();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const isAdmin = currentRole === 'admin';

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header Banner */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-bold">
                Fountain Gate Chapel
              </span>
              <span className="text-xs text-indigo-200">|</span>
              <span className="text-xs text-indigo-200 font-medium">Real-time Operations</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Pastoral Executive Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-2xl">
              Proactive member care tracking, live service ecosystem, direct WhatsApp outreach, and real-time financial stewardship.
            </p>
          </div>

          {/* Quick Action Hub */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCheckIn(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-md"
            >
              <span>Rapid Attendance Check-In</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition"
              >
                <span>+ Member (Admin)</span>
              </button>
            )}

            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border transition ${
                isLive
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-indigo-950/60 text-indigo-200 border-indigo-700 hover:bg-indigo-900'
              }`}
            >
              <span>{isLive ? 'Live Active' : 'Go Live'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <MetricsOverview />

      {/* Analytics Charts & At Risk Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <AttendanceChart />
          <FinancialBreakdownChart />
        </div>
        <div>
          <AtRiskInterventionSummary />
        </div>
      </div>

      {/* Modals */}
      {showCheckIn && <RapidCheckInModal onClose={() => setShowCheckIn(false)} />}
      {showAddMember && <AddMemberModal onClose={() => setShowAddMember(false)} />}
    </div>
  );
}
