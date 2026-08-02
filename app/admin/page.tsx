'use client';

import React, { useState } from 'react';
import { UserRoleManagement } from '../../components/admin/UserRoleManagement';
import { AuditLogFeed } from '../../components/admin/AuditLogFeed';
import { DataExportCenter } from '../../components/admin/DataExportCenter';
import { useChurch } from '../../lib/context/ChurchContext';

export default function AdminPage() {
  const { currentRole } = useChurch();
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'export'>('users');

  const isAdmin = currentRole === 'admin';

  if (!isAdmin) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-bold text-2xl">
          🔒
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Admin Panel Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You must be signed in with an Admin role account to access user role delegation, audit logs, and data exports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
          Admin Management Panel
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          User role delegation, security audit logs, and data export center.
        </p>
      </div>

      {/* Admin Subtabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl border border-slate-300 max-w-md">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'users' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          User Roles
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'audit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'export' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Data Export
        </button>
      </div>

      {activeTab === 'users' && <UserRoleManagement />}
      {activeTab === 'audit' && <AuditLogFeed />}
      {activeTab === 'export' && <DataExportCenter />}
    </div>
  );
}
