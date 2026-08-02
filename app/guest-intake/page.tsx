'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export default function GuestIntakePage() {
  const { addMember, t } = useChurch();

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
    <div className="max-w-md mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Brand Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 text-center space-y-3 bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-950 text-white shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-bold text-xl mx-auto flex items-center justify-center shadow-lg">
          FGC
        </div>
        <div>
          <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
            Fountain Gate Chapel
          </span>
          <h2 className="font-display font-bold text-2xl text-white mt-2">{t.guestWelcomeHeader}</h2>
          <p className="text-xs text-indigo-100 max-w-xs mx-auto">
            {t.guestSubtitle}
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="glass-panel p-8 rounded-3xl border border-emerald-300 text-center space-y-4 bg-emerald-50 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold text-2xl">
            ✓
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900">{t.guestSuccessHeader}, {firstName}!</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
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
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
          >
            Fill Another Welcome Form
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-4 text-xs shadow-md bg-white">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-display font-bold text-sm text-slate-900">First-Time Guest Connect Card</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">{t.firstName} *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Grace"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">{t.lastName} *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Mensah"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">{t.phoneLabel} *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233244000111"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="grace@gmail.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Residential Address / City</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. East Legon, Accra"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Prayer Request / Note for Pastors</label>
            <textarea
              rows={3}
              value={prayerRequest}
              onChange={(e) => setPrayerRequest(e.target.value)}
              placeholder="How can our pastoral team stand in faith with you?"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition"
          >
            {t.submitGuestCard}
          </button>
        </form>
      )}
    </div>
  );
}
