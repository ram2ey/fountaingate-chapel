'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { GivingType, PaymentMethod } from '../../lib/types/church';

interface Props {
  onClose: () => void;
}

export const RecordGivingModal: React.FC<Props> = ({ onClose }) => {
  const { members, addContribution } = useChurch();

  const [donorType, setDonorType] = useState<'member' | 'guest'>('member');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [guestName, setGuestName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<GivingType>('tithe');
  const [method, setMethod] = useState<PaymentMethod>('mobile_money');
  const [refNo, setRefNo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || (donorType === 'guest' && !guestName)) return;

    const selectedMember = members.find(m => m.id === selectedMemberId);

    addContribution({
      member_id: donorType === 'member' ? selectedMemberId : undefined,
      donor_name: donorType === 'guest' ? guestName : (selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Member Donor'),
      amount: parseFloat(amount),
      currency: 'GHS',
      type,
      payment_method: method,
      reference_no: refNo || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      giving_date: new Date().toISOString().split('T')[0]
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-display font-bold text-xl text-slate-900">Record Financial Contribution</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Donor Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDonorType('member')}
              className={`p-2.5 rounded-xl border text-center font-bold transition ${
                donorType === 'member'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              Registered Member
            </button>
            <button
              type="button"
              onClick={() => setDonorType('guest')}
              className={`p-2.5 rounded-xl border text-center font-bold transition ${
                donorType === 'guest'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              Guest / Anonymous
            </button>
          </div>

          {donorType === 'member' ? (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Select Member *</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.phone})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Donor Name *</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Visitor Donor / Anonymous"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Amount (GHS) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500.00"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Giving Fund *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as GivingType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="tithe">Tithe</option>
                <option value="offering">Sunday Offering</option>
                <option value="building_fund">Building Fund</option>
                <option value="special_seed">Special Seed</option>
                <option value="missions">Missions Outreach</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Payment Method *</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="mobile_money">MTN MoMo / Telecel Cash</option>
                <option value="cash">Cash</option>
                <option value="pos_card">POS Card Terminal</option>
                <option value="bank_transfer">Bank Wire Transfer</option>
                <option value="online_checkout">Online Checkout</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Reference / Transaction ID</label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="TXN-99881122"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition"
            >
              Save Financial Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
