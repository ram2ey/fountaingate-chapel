'use client';

import React from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { PrayerRequest, PrayerStatus } from '../../lib/types/church';

interface Props {
  request: PrayerRequest;
}

export const PrayerCard: React.FC<Props> = ({ request }) => {
  const { incrementPrayerCount, updatePrayerStatus, deletePrayerRequest, currentRole } = useChurch();

  const isPastorOrAdmin = currentRole === 'admin' || currentRole === 'pastor';

  const handleWhatsAppOutreach = () => {
    const cleanPhone = request.requester_phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Shalom ${request.requester_name}, this is Pastor from Fountain Gate Chapel. I am standing in prayer with you for your request: "${request.title}". God is working!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className={`glass-panel p-5 rounded-2xl border transition shadow-sm space-y-3 bg-white ${
      request.status === 'answered_testimony' ? 'border-emerald-300 bg-emerald-50/40' :
      request.is_confidential_to_pastors ? 'border-amber-300 bg-amber-50/40' :
      'border-slate-200'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
            {request.category}
          </span>

          {request.status === 'answered_testimony' && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase">
              🎉 Praise Testimony
            </span>
          )}

          {request.is_confidential_to_pastors && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase">
              🔒 Confidential to Pastors
            </span>
          )}
        </div>

        <span className="text-[10px] text-slate-400 font-semibold">{request.created_at}</span>
      </div>

      <div>
        <h4 className="font-display font-bold text-base text-slate-900 leading-snug">{request.title}</h4>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{request.details}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700">
            Posted by: <span className="text-indigo-700">{request.is_anonymous ? 'Anonymous Member' : request.requester_name}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* I Prayed Button */}
          <button
            onClick={() => incrementPrayerCount(request.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs shadow-xs transition"
          >
            <span>🙏 I Prayed ({request.prayed_count})</span>
          </button>

          {/* Pastoral WhatsApp Action */}
          {isPastorOrAdmin && (
            <button
              onClick={handleWhatsAppOutreach}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition"
              title="Send WhatsApp encouragement message"
            >
              WhatsApp Pastor Outreach
            </button>
          )}

          {/* Pastoral Status Controls */}
          {isPastorOrAdmin && (
            <select
              value={request.status}
              onChange={(e) => updatePrayerStatus(request.id, e.target.value as PrayerStatus)}
              className="bg-slate-100 border border-slate-300 text-slate-800 rounded-xl px-2 py-1 text-[11px] font-bold"
            >
              <option value="active">Active Prayer</option>
              <option value="under_pastoral_care">Under Pastoral Prayer</option>
              <option value="answered_testimony">Answered Testimony</option>
            </select>
          )}

          {/* Admin Delete */}
          {currentRole === 'admin' && (
            <button
              onClick={() => deletePrayerRequest(request.id)}
              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-bold"
              title="Delete request"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
