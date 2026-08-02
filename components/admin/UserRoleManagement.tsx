'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { UserRole } from '../../lib/types/church';

export const UserRoleManagement: React.FC = () => {
  const { systemUsers, addUser, updateUserRole } = useChurch();

  const [showAddUser, setShowAddUser] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('pastor');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    addUser({
      full_name: fullName,
      phone,
      email: email || undefined,
      role
    });

    setFullName('');
    setPhone('');
    setEmail('');
    setShowAddUser(false);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">User Role Delegation & Leadership Accounts</h4>
          <p className="text-xs text-slate-500">Manage system users and assign Admin, Pastor, or Member permissions</p>
        </div>

        <button
          onClick={() => setShowAddUser(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
        >
          + Add New User / Pastor
        </button>
      </div>

      {showAddUser && (
        <form onSubmit={handleAddUser} className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3 text-xs animate-in zoom-in-95">
          <h5 className="font-bold text-indigo-900 text-xs">Create New User Account</h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Pastor John Mensah"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone / WhatsApp Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233244000111"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@fgc.org"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Assign Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
              >
                <option value="admin">Admin (Full System Control)</option>
                <option value="pastor">Pastor (Pastoral Care & Sermons)</option>
                <option value="member">Member (Read Only)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddUser(false)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3 pl-4">User Name</th>
              <th className="p-3">Phone Number</th>
              <th className="p-3">Email</th>
              <th className="p-3">Current Role</th>
              <th className="p-3 text-right pr-4">Role Delegation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {systemUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition">
                <td className="p-3 pl-4 font-bold text-slate-900">{user.full_name}</td>
                <td className="p-3 font-semibold text-slate-800">{user.phone}</td>
                <td className="p-3 text-slate-500">{user.email || 'N/A'}</td>
                <td className="p-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    user.role === 'admin' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    user.role === 'pastor' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    'bg-indigo-100 text-indigo-800 border-indigo-300'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-3 text-right pr-4">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                    className="bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-600 shadow-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="pastor">Pastor</option>
                    <option value="member">Member</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
