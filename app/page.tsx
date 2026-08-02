'use client';

import React, { useState } from 'react';
import { MetricsOverview } from '../components/dashboard/MetricsOverview';
import { AttendanceChart } from '../components/dashboard/AttendanceChart';
import { FinancialBreakdownChart } from '../components/dashboard/FinancialBreakdownChart';
import { AtRiskInterventionSummary } from '../components/dashboard/AtRiskInterventionSummary';
import { RapidCheckInModal } from '../components/care/RapidCheckInModal';
import { AddMemberModal } from '../components/members/AddMemberModal';
import { useChurch } from '../lib/context/ChurchContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentBranch, isLive, setIsLive, currentRole } = useChurch();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const isAdmin = currentRole === 'admin';

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
                {currentBranch.name}
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-400 font-medium">Real-time Church Operations</span>
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Pastoral Executive Dashboard
            </h2>
            <p className="text-xs lg:text-sm text-slate-400 mt-1 max-w-2xl">
              Proactive member care tracking, live service ecosystem, direct WhatsApp outreach, and real-time financial stewardship.
            </p>
          </div>

          {/* Quick Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowCheckIn(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-900/50"
            >
              <span>Rapid Attendance Check-In</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              >
                <span>New Member Intake (Admin)</span>
              </button>
            )}

            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs border transition ${
                isLive
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>{isLive ? 'Live Banner Active' : 'Go Live'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <MetricsOverview />

      {/* Analytics Charts & At Risk Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
