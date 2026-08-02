'use client';

import React, { useState } from 'react';
import { MemberDirectoryTable } from '../../components/members/MemberDirectoryTable';
import { FirstTimeGuestPipeline } from '../../components/members/FirstTimeGuestPipeline';
import { MemberProfileDrawer } from '../../components/members/MemberProfileDrawer';
import { AddMemberModal } from '../../components/members/AddMemberModal';
import { Member } from '../../lib/types/church';
import { useChurch } from '../../lib/context/ChurchContext';

export default function MembersPage() {
  const { currentRole } = useChurch();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const isAdmin = currentRole === 'admin';

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              Members & Guest Intake
            </h1>
            {isAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                Admin Intake Mode
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200">
                View Only Mode
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isAdmin 
              ? 'Admin role active: Manual intake enabled alongside QR code guest registration.' 
              : 'Pastoral view active: Access directory records and member profiles.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
          >
            + Register Member (Admin)
          </button>
        )}
      </div>

      <FirstTimeGuestPipeline />
      <MemberDirectoryTable onSelectMember={(member) => setSelectedMember(member)} />

      {selectedMember && (
        <MemberProfileDrawer
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {showAddModal && (
        <AddMemberModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
