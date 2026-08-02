'use client';

import React, { useState } from 'react';
import { MemberDirectoryTable } from '../../components/members/MemberDirectoryTable';
import { FirstTimeGuestPipeline } from '../../components/members/FirstTimeGuestPipeline';
import { AddMemberModal } from '../../components/members/AddMemberModal';

export default function MembersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'retention'>('directory');

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Central Member Directory & Guests</h2>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive profile records, dynamic tagging, and automated guest retention.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Members Directory
          </button>
          <button
            onClick={() => setActiveTab('retention')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'retention'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Guest Retention Pipeline</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'directory' ? (
        <MemberDirectoryTable onOpenAddModal={() => setShowAddModal(true)} />
      ) : (
        <FirstTimeGuestPipeline />
      )}

      {showAddModal && <AddMemberModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
