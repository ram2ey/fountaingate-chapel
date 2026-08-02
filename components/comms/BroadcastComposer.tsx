'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';

export const BroadcastComposer: React.FC<{ initialTemplate?: string }> = ({ initialTemplate }) => {
  const { sendBroadcast, members, broadcasts, currentBranch } = useChurch();

  const [channel, setChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [targetGroup, setTargetGroup] = useState('Cell Leaders & Care Team');
  const [message, setMessage] = useState(initialTemplate || '');
  const [sentSuccess, setSentSuccess] = useState(false);

  const getRecipientCount = () => {
    if (targetGroup === 'All Active Members') return members.length;
    if (targetGroup === 'Cell Leaders & Care Team') return 18;
    if (targetGroup === 'Choir & Worship Ministry') return 24;
    if (targetGroup === 'Ushering & Protocol') return 30;
    return 15;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;

    sendBroadcast({
      branch_id: currentBranch.id,
      channel,
      target_group: targetGroup,
      message,
      recipient_count: getRecipientCount(),
      sent_by_name: 'Rev. Dr. Eastwood Anaba'
    });

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setMessage('');
    }, 2500);
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div>
        <h3 className="font-display font-bold text-lg text-white">
          Multi-Channel WhatsApp & SMS Broadcast Composer
        </h3>
        <p className="text-xs text-slate-400">
          Send direct bulk notices to targeted ministries, ushering teams, and cell leaders via WhatsApp & SMS.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Channel Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Broadcast Channel</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setChannel('WhatsApp')}
                className={`py-2 rounded-lg font-bold transition ${
                  channel === 'WhatsApp'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                WhatsApp API
              </button>
              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`py-2 rounded-lg font-bold transition ${
                  channel === 'SMS'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SMS Direct
              </button>
            </div>
          </div>

          {/* Target Group */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Group Filter</label>
            <select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="All Active Members">All Active Members ({members.length})</option>
              <option value="Cell Leaders & Care Team">Cell Leaders & Care Team (18)</option>
              <option value="Choir & Worship Ministry">Choir & Worship Ministry (24)</option>
              <option value="Ushering & Protocol">Ushering & Protocol (30)</option>
              <option value="Youth & Young Adults">Youth & Young Adults (45)</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-slate-300 font-semibold">Message Body</label>
            <span className="text-[10px] text-slate-400">{message.length} characters</span>
          </div>
          <textarea
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your official announcement or broadcast notice..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-slate-400 font-semibold">
            Ready to dispatch to <strong className="text-amber-400">{getRecipientCount()} Recipient Phones</strong>
          </span>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-950/50"
          >
            Dispatch Broadcast
          </button>
        </div>

        {sentSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold animate-in fade-in">
            Broadcast dispatched successfully! {getRecipientCount()} messages delivered to recipient queue.
          </div>
        )}
      </form>

      {/* Broadcast History */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <h4 className="font-display font-bold text-sm text-slate-300">Sent Broadcast Dispatch Log</h4>
        <div className="space-y-2">
          {broadcasts.map(b => (
            <div key={b.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    b.channel === 'WhatsApp' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {b.channel}
                  </span>
                  <span className="font-bold text-slate-200">{b.target_group}</span>
                  <span className="text-[10px] text-slate-400">({b.recipient_count} recipients)</span>
                </div>
                <p className="text-slate-300 text-[11px]">"{b.message}"</p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 ml-4">{b.created_at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
