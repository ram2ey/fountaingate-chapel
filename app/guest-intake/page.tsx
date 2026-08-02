'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export default function GuestIntakePage() {
  const { addMember, currentBranch, t } = useChurch();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) return;

    addMember({
      branch_id: currentBranch.id,
      first_name: firstName,
      last_name: lastName,
      email: email || undefined,
      phone,
      address: address || undefined,
      cell_group: 'Unassigned',
      status: 'first_time_guest',
      tags: ['First Time Visitor', 'Intake Form']
    });

    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      {/* Brand Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-center space-y-3 bg-gradient-to-b from-indigo-950/60 to-slate-900 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-600 to-indigo-900 mx-auto flex items-center justify-center text-white font-bold text-xl shadow-lg">
          FGC
        </div>
        <div>
          <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
            {currentBranch.name}
          </span>
          <h2 className="font-display font-bold text-2xl text-white mt-2">{t.guestWelcomeHeader}</h2>
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {t.guestSubtitle}
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/40 text-center space-y-4 bg-emerald-500/10">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold text-2xl">
            ✓
          </div>
          <h3 className="font-display font-bold text-xl text-white">{t.guestSuccessHeader}, {firstName}!</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t.guestSuccessMsg}
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFirstName('');
              setLastName('');
              setPhone('');
              setEmail('');
              setPrayerRequest('');
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Fill Another Welcome Form
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs shadow-2xl">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="font-display font-bold text-sm text-slate-200">First-Time Guest Connect Card</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">{t.firstName} *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Grace"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">{t.lastName} *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Mensah"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">{t.phoneLabel} *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233244000111"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="grace@example.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Residential Address / Area</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. East Legon, Accra"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Prayer Request / Pastoral Note</label>
            <textarea
              rows={3}
              value={prayerRequest}
              onChange={(e) => setPrayerRequest(e.target.value)}
              placeholder="How can our prayer team stand in faith with you this week?"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg transition"
          >
            {t.submitGuestCard}
          </button>
        </form>
      )}
    </div>
  );
}
