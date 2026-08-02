'use client';

import React, { useState } from 'react';
import { GivingLedgerTable } from '../../components/financials/GivingLedgerTable';
import { RecordGivingModal } from '../../components/financials/RecordGivingModal';
import { PdfStatementGenerator } from '../../components/financials/PdfStatementGenerator';
import { useChurch } from '../../lib/context/ChurchContext';

export default function FinancialsPage() {
  const { currentRole } = useChurch();
  const [showRecordModal, setShowRecordModal] = useState(false);

  const isAdmin = currentRole === 'admin';

  if (!isAdmin) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-bold text-2xl">
          🔒
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Access Restricted to Church Admins</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Financial tithes, offering ledgers, and bank statements are restricted to Admin role credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Financial Ledger & Giving Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track tithes, Sunday offerings, building fund contributions, and generate PDF receipts.
          </p>
        </div>

        <button
          onClick={() => setShowRecordModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
        >
          + Record Contribution
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GivingLedgerTable />
        </div>
        <div>
          <PdfStatementGenerator />
        </div>
      </div>

      {showRecordModal && <RecordGivingModal onClose={() => setShowRecordModal(false)} />}
    </div>
  );
}
