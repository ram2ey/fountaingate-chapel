'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { GivingType, PaymentMethod } from '../../lib/types/church';

export default function OnlineGivingPage() {
  const { addContribution, currentUser, contributions } = useChurch();

  const [donorName, setDonorName] = useState(currentUser?.full_name || 'Church Donor');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('GHS');
  const [type, setType] = useState<GivingType>('tithe');
  const [method, setMethod] = useState<PaymentMethod>('mobile_money');
  const [momoNumber, setMomoNumber] = useState(currentUser?.phone || '');
  const [momoProvider, setMomoProvider] = useState('MTN Mobile Money');
  const [successReceipt, setSuccessReceipt] = useState<{ id: string; amount: number; type: string; date: string } | null>(null);

  const handleGive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const newGiving = {
      member_id: currentUser?.id,
      donor_name: donorName,
      amount: parseFloat(amount),
      currency,
      type,
      payment_method: method,
      reference_no: `${method.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      giving_date: new Date().toISOString().split('T')[0]
    };

    addContribution(newGiving);

    setSuccessReceipt({
      id: newGiving.reference_no,
      amount: newGiving.amount,
      type: newGiving.type,
      date: newGiving.giving_date
    });

    setAmount('');
  };

  const userGivingHistory = contributions.filter(c => c.member_id === currentUser?.id || c.donor_name === currentUser?.full_name);

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      {/* High-Contrast Welcome & Scripture Banner (No Pill Tag) */}
      <div className="glass-panel p-6 sm:p-8 rounded-none border border-emerald-200 bg-emerald-50/80 shadow-md space-y-3 relative overflow-hidden">
        <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Online Giving & Tithe Portal
        </h1>

        <div className="p-4 rounded-none bg-white border border-emerald-100 shadow-xs space-y-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-800 italic leading-relaxed">
            "Honor the LORD with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing, and your vats will brim over with new wine."
          </p>
          <p className="text-[11px] font-extrabold text-emerald-700 text-right uppercase tracking-wider">
            — Proverbs 3:9-10
          </p>
        </div>
      </div>

      {successReceipt && (
        <div className="glass-panel p-6 rounded-none border border-emerald-300 bg-emerald-50 text-emerald-950 shadow-md space-y-3 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-none bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-emerald-900">Giving Receipt Confirmed!</h3>
              <p className="text-xs text-emerald-700">Ref No: {successReceipt.id} • {successReceipt.date}</p>
            </div>
          </div>
          <p className="text-xs text-slate-700">
            Thank you for your generous <span className="font-bold uppercase text-emerald-900">{successReceipt.type}</span> of <span className="font-bold text-slate-900">GHS {successReceipt.amount}</span> to Fountain Gate Chapel. May God open the windows of heaven over your life!
          </p>
          <button
            onClick={() => setSuccessReceipt(null)}
            className="px-4 py-2 rounded-none bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs"
          >
            Close Receipt
          </button>
        </div>
      )}

      {/* Main Giving Form Card */}
      <div className="glass-panel p-6 rounded-none border border-slate-200 bg-white shadow-md space-y-5">
        <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
          Make a Tithe, Offering or Seed Contribution
        </h3>

        <form onSubmit={handleGive} className="space-y-4 text-xs">
          {/* Giving Category Selector */}
          <div>
            <label className="block text-slate-700 font-bold mb-2">Select Giving Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Tithe', val: 'tithe' },
                { label: 'Sunday Offering', val: 'offering' },
                { label: 'Building Fund', val: 'building_fund' },
                { label: 'Missions', val: 'missions' },
                { label: 'Special Seed', val: 'special_seed' },
              ].map(cat => (
                <button
                  key={cat.val}
                  type="button"
                  onClick={() => setType(cat.val as GivingType)}
                  className={`p-3 rounded-none font-bold text-xs transition text-center border ${
                    type === cat.val
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Giving Amount *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                  {currency}
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-none pl-14 pr-4 py-3 text-slate-900 font-extrabold text-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-none p-3 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
              >
                <option value="GHS">GHS (Ghana Cedi)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-2">Select Payment Method *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMethod('mobile_money')}
                className={`p-3.5 rounded-none border text-left font-bold transition ${
                  method === 'mobile_money'
                    ? 'bg-amber-50 text-amber-900 border-amber-400 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📱</span>
                  <div>
                    <p className="text-xs">Mobile Money</p>
                    <p className="text-[10px] text-slate-500 font-normal">MTN MoMo, Telecel, AT</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('pos_card')}
                className={`p-3.5 rounded-none border text-left font-bold transition ${
                  method === 'pos_card'
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-400 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">💳</span>
                  <div>
                    <p className="text-xs">Debit / Credit Card</p>
                    <p className="text-[10px] text-slate-500 font-normal">Visa & Mastercard</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                className={`p-3.5 rounded-none border text-left font-bold transition ${
                  method === 'bank_transfer'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏦</span>
                  <div>
                    <p className="text-xs">Bank Transfer</p>
                    <p className="text-[10px] text-slate-500 font-normal">Direct Account Deposit</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Money Details */}
          {method === 'mobile_money' && (
            <div className="p-4 rounded-none bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-900 font-bold mb-1">Network Provider</label>
                  <select
                    value={momoProvider}
                    onChange={(e) => setMomoProvider(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-none p-2.5 text-amber-950 font-bold"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money (*170#)</option>
                    <option value="Telecel Cash">Telecel Cash (*110#)</option>
                    <option value="AT Money">AT Money (*110#)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-amber-900 font-bold mb-1">MoMo Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    placeholder="+233244000111"
                    className="w-full bg-white border border-amber-300 rounded-none p-2.5 text-amber-950 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-md transition"
            >
              Complete Giving Transaction ({currency} {amount || '0.00'})
            </button>
          </div>
        </form>
      </div>

      {/* Personal Giving History */}
      {userGivingHistory.length > 0 && (
        <div className="glass-panel p-5 rounded-none border border-slate-200 bg-white shadow-sm space-y-3">
          <h4 className="font-display font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            My Giving History & Digital Receipts
          </h4>

          <div className="divide-y divide-slate-100 text-xs">
            {userGivingHistory.map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 uppercase text-xs">{item.type}</p>
                  <p className="text-[10px] text-slate-400">{item.giving_date} • {item.payment_method}</p>
                </div>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {item.currency} {item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
