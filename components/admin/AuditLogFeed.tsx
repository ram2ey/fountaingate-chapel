'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const AuditLogFeed: React.FC = () => {
  const { auditLogs } = useChurch();

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 bg-white">
      <div>
        <h4 className="font-display font-bold text-base text-slate-900">System Audit & Security Activity Feed</h4>
        <p className="text-xs text-slate-500">Real-time audit Trail tracking admin logins, care logs, and financial records</p>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {auditLogs.map((log) => (
          <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px]">
                {log.action}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">{log.created_at}</span>
            </div>
            <p className="text-slate-900 font-semibold">{log.details}</p>
            <p className="text-[10px] text-slate-500">Triggered by: {log.user_name} ({log.user_phone})</p>
          </div>
        ))}
      </div>
    </div>
  );
};
