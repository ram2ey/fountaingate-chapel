'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const UserProfileSettings: React.FC = () => {
  const { currentUser } = useChurch();

  const [fullName, setFullName] = useState(currentUser?.full_name || 'Rev. Eastwood Anaba');
  const [phone, setPhone] = useState(currentUser?.phone || '+233244000111');
  const [email, setEmail] = useState(currentUser?.email || 'eastwood@fgc.org');
  const [savedMsg, setSavedMsg] = useState('');

  const [notifications, setNotifications] = useState({
    whatsappCareAlerts: true,
    smsGivingReceipts: true
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('Account settings updated successfully!');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  return (
    <div className="space-y-6">
      {savedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center animate-in zoom-in-95">
          ✓ {savedMsg}
        </div>
      )}

      {/* Personal Info Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 bg-white">
        <h4 className="font-display font-bold text-base text-slate-900">Personal Account Details</h4>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">WhatsApp / Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Notifications Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 bg-white">
        <h4 className="font-display font-bold text-base text-slate-900">Notification Preferences</h4>

        <div className="space-y-3 pt-2 text-xs text-slate-800">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <p className="font-bold">Pastoral Care WhatsApp Alerts</p>
              <p className="text-[11px] text-slate-500">Receive instant alerts when members are flagged as at-risk</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.whatsappCareAlerts}
              onChange={(e) => setNotifications({ ...notifications, whatsappCareAlerts: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <p className="font-bold">Financial Giving Receipts (SMS/WhatsApp)</p>
              <p className="text-[11px] text-slate-500">Receive instant confirmation receipts for tithe records</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.smsGivingReceipts}
              onChange={(e) => setNotifications({ ...notifications, smsGivingReceipts: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
