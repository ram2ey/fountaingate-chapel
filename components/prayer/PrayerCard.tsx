'use client';

import React, { useState, useEffect } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { PrayerRequest, PrayerStatus } from '../../lib/types/church';

interface Props {
  request: PrayerRequest;
}

export const PrayerCard: React.FC<Props> = ({ request }) => {
  const {
    incrementPrayerCount,
    updatePrayerStatus,
    deletePrayerRequest,
    addPrayerComment,
    addPrayerUpdate,
    currentRole,
    currentUser
  } = useChurch();

  const isPastorOrAdmin = currentRole === 'admin' || currentRole === 'pastor';

  // Spam-guard: track prayed request IDs in sessionStorage
  const [hasPrayed, setHasPrayed] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [showUpdateBox, setShowUpdateBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [showThread, setShowThread] = useState(false);

  useEffect(() => {
    const prayed = JSON.parse(sessionStorage.getItem('fgc_prayed_ids') || '[]');
    setHasPrayed(prayed.includes(request.id));
  }, [request.id]);

  const handlePray = () => {
    if (hasPrayed) return;
    incrementPrayerCount(request.id);
    const prayed = JSON.parse(sessionStorage.getItem('fgc_prayed_ids') || '[]');
    prayed.push(request.id);
    sessionStorage.setItem('fgc_prayed_ids', JSON.stringify(prayed));
    setHasPrayed(true);
  };

  const handleWhatsAppOutreach = () => {
    const cleanPhone = request.requester_phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Shalom ${request.requester_name}, this is Pastor from Fountain Gate Chapel. I am standing in prayer with you for your request: "${request.title}". God is working!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    addPrayerComment(request.id, commentText.trim(), currentUser?.full_name || 'Church Member');
    setCommentText('');
    setShowCommentBox(false);
    setShowThread(true);
  };

  const handleSubmitUpdate = () => {
    if (!updateText.trim()) return;
    addPrayerUpdate(request.id, updateText.trim(), currentUser?.full_name || 'Church Member');
    setUpdateText('');
    setShowUpdateBox(false);
    setShowThread(true);
  };

  const hasThread = request.comments.length > 0 || request.updates.length > 0;

  return (
    <div className={`glass-panel rounded-2xl border transition shadow-sm space-y-3 bg-white overflow-hidden ${
      request.is_urgent ? 'border-rose-400 ring-1 ring-rose-300' :
      request.status === 'answered_testimony' ? 'border-emerald-300 bg-emerald-50/40' :
      request.is_confidential_to_pastors ? 'border-amber-300 bg-amber-50/40' :
      'border-slate-200'
    }`}>
      {/* Urgent stripe */}
      {request.is_urgent && (
        <div className="bg-rose-600 text-white text-center text-[10px] font-bold py-1 uppercase tracking-widest animate-pulse">
          🔴 Urgent Prayer Request — Please Pray Now
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* Header Row */}
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

            {request.status === 'under_pastoral_care' && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase">
                🙌 Under Pastoral Prayer
              </span>
            )}

            {request.is_confidential_to_pastors && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase">
                🔒 Confidential to Pastors
              </span>
            )}
          </div>

          <span className="text-[10px] text-slate-400 font-semibold shrink-0">{request.created_at}</span>
        </div>

        {/* Title & Details */}
        <div>
          <h4 className="font-display font-bold text-base text-slate-900 leading-snug">{request.title}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{request.details}</p>
        </div>

        {/* Scripture Reference Block */}
        {request.scripture_reference && (
          <div className="px-3 py-2 rounded-xl bg-indigo-50/70 border-l-4 border-indigo-400 text-xs text-indigo-800 font-semibold italic">
            📖 "{request.scripture_reference}"
          </div>
        )}

        {/* Footer Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700">
              Posted by: <span className="text-indigo-700">{request.is_anonymous ? 'Anonymous Member' : request.requester_name}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* I Prayed Button (Spam-Guarded) */}
            <button
              onClick={handlePray}
              disabled={hasPrayed}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition border ${
                hasPrayed
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-default'
                  : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
              }`}
            >
              <span>{hasPrayed ? '✓ Prayed' : `🙏 I Prayed (${request.prayed_count})`}</span>
            </button>

            {/* Encouragement Button */}
            <button
              onClick={() => { setShowCommentBox(!showCommentBox); setShowThread(true); }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-[11px] shadow-xs transition"
            >
              💬 Encourage
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

            {/* Post Update Button (submitter or pastors) */}
            <button
              onClick={() => { setShowUpdateBox(!showUpdateBox); setShowThread(true); }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[11px] shadow-xs transition"
            >
              📢 Post Update
            </button>

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

        {/* Encouragement Comment Input Box */}
        {showCommentBox && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write an encouragement (e.g. 🙏 Standing with you!)"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            />
            <button
              onClick={handleSubmitComment}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs"
            >
              Send
            </button>
          </div>
        )}

        {/* Prayer Update Input Box */}
        {showUpdateBox && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="Share an update on this request (e.g. Surgery went well! Praise God!)"
              className="flex-1 bg-slate-50 border border-emerald-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitUpdate()}
            />
            <button
              onClick={handleSubmitUpdate}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Post
            </button>
          </div>
        )}

        {/* Thread Toggle */}
        {hasThread && (
          <button
            onClick={() => setShowThread(!showThread)}
            className="text-[10px] font-bold text-indigo-600 hover:underline mt-1"
          >
            {showThread ? '▲ Hide Thread' : `▼ View Thread (${request.comments.length + request.updates.length})`}
          </button>
        )}
      </div>

      {/* Encouragement & Update Thread */}
      {showThread && hasThread && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 space-y-2">
          {/* Updates (Praise Reports) */}
          {request.updates.map(upd => (
            <div key={upd.id} className="flex items-start gap-2.5 py-1.5 border-b border-slate-100 last:border-0">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                📢
              </div>
              <div>
                <p className="text-[11px] font-bold text-emerald-900">{upd.author_name} • Praise Update</p>
                <p className="text-xs text-slate-700 mt-0.5">{upd.text}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{upd.created_at}</p>
              </div>
            </div>
          ))}

          {/* Encouragement Comments */}
          {request.comments.map(comment => (
            <div key={comment.id} className="flex items-start gap-2.5 py-1.5 border-b border-slate-100 last:border-0">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                🙏
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-900">{comment.author_name}</p>
                <p className="text-xs text-slate-700 mt-0.5">{comment.text}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{comment.created_at}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
