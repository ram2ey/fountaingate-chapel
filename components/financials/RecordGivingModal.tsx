'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { GivingType, PaymentMethod } from '../../lib/types/church';

export const RecordGivingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { members, addContribution, currentBranch } = useChurch();

  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [givingType, setGivingType] = useState<GivingType>('tithe');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [refNo, setRefNo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const selectedMember = members.find(m => m.id === memberId);
    const finalDonorName = donorName || (selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Anonymous Giver');

    addContribution({
      branch_id: currentBranch.id,
      member_id: memberId || undefined,
      donor_name: finalDonorName,
      amount: parseFloat(amount),
      currency: 'GHS',
      type: givingType,
      payment_method: paymentMethod,
      reference_no: refNo || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      giving_date: new Date().toISOString().split('T')[0]
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-bold">
          ✕
        </button>

        <div className="mb-4">
          <h3 className="font-display font-bold text-lg text-white">Record Tithe or Contribution</h3>
          <p className="text-xs text-slate-400">Log financial entry into {currentBranch.name} ledger</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Donor / Member</label>
            <select
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                const m = members.find(item => item.id === e.target.value);
                if (m) setDonorName(`${m.first_name} ${m.last_name}`);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- General Anonymous / Sunday Service Offering --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name} ({m.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Amount (GHS) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Giving Fund Type</label>
              <select
                value={givingType}
                onChange={(e) => setGivingType(e.target.value as GivingType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="tithe">Tithe (10%)</option>
                <option value="offering">Sunday Service Offering</option>
                <option value="building_fund">Building & Sanctuary Pledge</option>
                <option value="missions">Missions & Evangelism</option>
                <option value="special_seed">Special Seed / Prophet's Offering</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="mobile_money">Mobile Money (MTN MoMo / Telecel)</option>
                <option value="pos_card">POS Credit/Debit Card</option>
                <option value="cash">Cash Collection</option>
                <option value="bank_transfer">Direct Bank Transfer</option>
                <option value="online_checkout">Online Paystack/Flutterwave</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Reference / Receipt No.</label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. MOMO-994821"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg"
            >
              Log Contribution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
