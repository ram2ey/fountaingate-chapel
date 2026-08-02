'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { jsPDF } from 'jspdf';

export const PdfStatementGenerator: React.FC = () => {
  const { members, contributions, currentBranch } = useChurch();
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [generating, setGenerating] = useState(false);

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const memberContributions = contributions.filter(c => c.member_id === selectedMemberId);
  const totalGiven = memberContributions.reduce((a, b) => a + b.amount, 0);

  const generatePDF = () => {
    if (!selectedMember) return;
    setGenerating(true);

    const doc = new jsPDF();

    // Header
    doc.setFillColor(30, 27, 75); // Deep Indigo
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(251, 191, 36); // Gold
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FOUNTAIN GATE CHAPEL', 14, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ANNUAL OFFICIAL GIVING & CONTRIBUTION STATEMENT - ${currentBranch.name.toUpperCase()}`, 14, 28);

    // Member Info Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Donor Information:`, 14, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${selectedMember.first_name} ${selectedMember.last_name}`, 14, 57);
    doc.text(`Phone: ${selectedMember.phone}`, 14, 63);
    doc.text(`Cell Group: ${selectedMember.cell_group}`, 14, 69);

    doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 130, 57);
    doc.text(`Tax Year: 2026`, 130, 63);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 75, 196, 75);

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 80, 182, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 18, 86);
    doc.text('Giving Type', 50, 86);
    doc.text('Payment Method', 100, 86);
    doc.text('Ref / Receipt #', 140, 86);
    doc.text('Amount (GHS)', 170, 86);

    // Rows
    let yPos = 96;
    doc.setFont('helvetica', 'normal');

    if (memberContributions.length === 0) {
      doc.text('No recorded contributions found for this period.', 18, yPos);
      yPos += 10;
    } else {
      memberContributions.forEach((contrib) => {
        doc.text(contrib.giving_date, 18, yPos);
        doc.text(contrib.type.replace('_', ' ').toUpperCase(), 50, yPos);
        doc.text(contrib.payment_method.replace('_', ' '), 100, yPos);
        doc.text(contrib.reference_no || 'N/A', 140, yPos);
        doc.text(contrib.amount.toFixed(2), 170, yPos);
        yPos += 8;
      });
    }

    // Total Line
    doc.line(14, yPos + 2, 196, yPos + 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Total Annual Contributions: GHS ${totalGiven.toFixed(2)}`, 110, yPos + 12);

    // Sign-off
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('This official tax statement confirms your faithful tithes & offerings to Fountain Gate Chapel.', 14, 270);
    doc.text('Authorized Pastoral Signature: Rev. Dr. Eastwood Anaba', 14, 276);

    doc.save(`FGC_Contribution_Statement_${selectedMember.first_name}_${selectedMember.last_name}.pdf`);
    setGenerating(false);
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div>
        <h3 className="font-display font-bold text-lg text-white">
          1-Click PDF Annual Tax Contribution Statement Generator
        </h3>
        <p className="text-xs text-slate-400">Generate certified annual contribution receipts for member tax purposes.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs">
        <div className="flex-1 w-full">
          <label className="block text-slate-300 font-semibold mb-1">Select Member for PDF Receipt</label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-semibold"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name} ({m.phone})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={generatePDF}
          disabled={generating || !selectedMember}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shrink-0"
        >
          {generating ? 'Generating PDF...' : 'Download Official PDF Receipt'}
        </button>
      </div>
    </div>
  );
};
