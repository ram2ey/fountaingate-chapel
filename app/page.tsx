'use client';

import React, { useState } from 'react';
import { MetricsOverview } from '../components/dashboard/MetricsOverview';
import { AttendanceChart } from '../components/dashboard/AttendanceChart';
import { FinancialBreakdownChart } from '../components/dashboard/FinancialBreakdownChart';
import { AtRiskInterventionSummary } from '../components/dashboard/AtRiskInterventionSummary';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';
import { RapidCheckInModal } from '../components/care/RapidCheckInModal';
import { AddMemberModal } from '../components/members/AddMemberModal';
import { useChurch } from '../lib/context/ChurchContext';

export default function DashboardPage() {
  const { isLive, setIsLive, currentRole } = useChurch();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const isAdmin = currentRole === 'admin';
  const isMember = currentRole === 'member';

  // Render tailored Member Portal for member role
  if (isMember) {
    return <MemberDashboard />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header Banner (No Pill Tag) */}
      <div className="glass-panel p-5 sm:p-6 rounded-none border border-indigo-200 bg-indigo-50/80 shadow-md space-y-3 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pastoral Executive Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-medium">
              "Be shepherds of God's flock that is under your care, watching over them." — 1 Peter 5:2
            </p>
          </div>

          {/* Quick Action Hub */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCheckIn(true)}
              className="px-4 py-2.5 rounded-none bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md"
            >
              <span>Rapid Attendance Check-In</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                className="px-3.5 py-2.5 rounded-none bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
              >
                <span>+ Member (Admin)</span>
              </button>
            )}

            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3.5 py-2.5 rounded-none font-bold text-xs border transition ${
                isLive
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
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
