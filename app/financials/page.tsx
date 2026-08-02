'use client';

import React from 'react';
import { GivingLedgerTable } from '../../components/financials/GivingLedgerTable';
import { PdfStatementGenerator } from '../../components/financials/PdfStatementGenerator';

export default function FinancialsPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Financial Stewardship & Tithe Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tithe ledger, mobile money & card gateway integrations, and certified PDF tax receipts.
          </p>
        </div>
      </div>

      <GivingLedgerTable />
      <PdfStatementGenerator />
    </div>
  );
}
