'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const BroadcastComposer: React.FC = () => {
  const { members, broadcasts, sendBroadcast } = useChurch();

  const [channel, setChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [targetGroup, setTargetGroup] = useState('All Active Members');
  const [message, setMessage] = useState('');
  const [sentNotice, setSentNotice] = useState('');

  const targetCount = targetGroup === 'All Active Members'
    ? members.filter(m => m.status === 'active').length
    : targetGroup === 'At-Risk Members'
    ? members.filter(m => m.status === 'at_risk').length
    : members.filter(m => m.status === 'first_time_guest').length;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;

    sendBroadcast({
      channel,
      target_group: targetGroup,
      message,
      recipient_count: targetCount,
      sent_by_name: 'Rev. Eastwood Anaba'
    });

    setSentNotice(`Broadcast sent via ${channel.toUpperCase()} to ${targetCount} recipients!`);
    setMessage('');
    setTimeout(() => setSentNotice(''), 3000);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h4 className="font-display font-bold text-base text-slate-900">WhatsApp & SMS Broadcast Composer</h4>
        <p className="text-xs text-slate-500">Send instant announcements to cell groups and sanctuary members</p>
      </div>

      {sentNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold animate-in zoom-in-95">
          ✓ {sentNotice}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4 text-xs">
        {/* Channel Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setChannel('WhatsApp')}
            className={`p-3 rounded-xl border text-center font-bold transition ${
              channel === 'WhatsApp'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            WhatsApp Broadcast
          </button>
          <button
            type="button"
            onClick={() => setChannel('SMS')}
            className={`p-3 rounded-xl border text-center font-bold transition ${
              channel === 'SMS'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            SMS Broadcast
          </button>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Target Audience Group *</label>
          <select
            value={targetGroup}
            onChange={(e) => setTargetGroup(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
          >
            <option value="All Active Members">All Active Members ({members.filter(m => m.status === 'active').length})</option>
            <option value="At-Risk Members">At-Risk Members ({members.filter(m => m.status === 'at_risk').length})</option>
            <option value="First-Time Visitors">First-Time Visitors ({members.filter(m => m.status === 'first_time_guest').length})</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Message Content *</label>
          <textarea
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Shalom Beloved, join us tomorrow for anointing service at 8:30 AM..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-slate-500 font-semibold">
            Recipients: <strong className="text-slate-800">{targetCount} members</strong>
          </span>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition"
          >
            Dispatch Broadcast Now
          </button>
        </div>
      </form>

      {/* Sent Log Feed */}
      <div className="pt-4 border-t border-slate-200 space-y-2">
        <h5 className="font-bold text-slate-800 text-xs">Recent Dispatch Logs ({broadcasts.length})</h5>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {broadcasts.map((b) => (
            <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 uppercase">{b.channel}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-600 font-medium">{b.target_group} ({b.recipient_count} sent)</span>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-sm">{b.message}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">{b.created_at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
