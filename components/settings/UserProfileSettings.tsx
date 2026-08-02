'use client';

import React, { useState, useEffect } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const UserProfileSettings: React.FC = () => {
  const { currentUser, updateCurrentUser } = useChurch();

  const [fullName, setFullName] = useState(currentUser?.full_name || 'Rev. Eastwood Anaba');
  const [phone, setPhone] = useState(currentUser?.phone || '+233244000111');
  const [email, setEmail] = useState(currentUser?.email || 'eastwood@fgc.org');
  const [savedMsg, setSavedMsg] = useState('');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  const [notifications, setNotifications] = useState({
    whatsappCareAlerts: true,
    smsGivingReceipts: true
  });

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name);
      setPhone(currentUser.phone);
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      full_name: fullName,
      phone,
      email: email || undefined
    });
    setSavedMsg('Profile updated successfully across the app!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('');
    setPassError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setPassError('Password must be at least 4 characters long.');
      return;
    }

    setPassMsg('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPassMsg(''), 3000);
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

      {/* Change Password Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 bg-white">
        <h4 className="font-display font-bold text-base text-slate-900">Security & Password</h4>

        {passMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center">
            ✓ {passMsg}
          </div>
        )}

        {passError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {passError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
            >
              Update Password
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
