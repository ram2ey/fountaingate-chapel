'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { PrayerCard } from '../../components/prayer/PrayerCard';
import { SubmitPrayerModal } from '../../components/prayer/SubmitPrayerModal';
import { PrayerCategory } from '../../lib/types/church';

const CATEGORIES: (PrayerCategory | 'All')[] = [
  'All',
  'Healing & Health',
  'Financial Breakthrough',
  'Family & Marriage',
  'Salvation & Spiritual Growth',
  'Career & Business',
  'General Intercession'
];

export default function PrayerWallPage() {
  const { prayerRequests, currentRole } = useChurch();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'testimonies' | 'pastoral'>('all');
  const [categoryFilter, setCategoryFilter] = useState<PrayerCategory | 'All'>('All');

  const isPastorOrAdmin = currentRole === 'admin' || currentRole === 'pastor';

  const pastoralQueueCount = prayerRequests.filter(
    r => r.is_confidential_to_pastors || r.status === 'under_pastoral_care'
  ).length;

  const visibleRequests = prayerRequests
    .filter(req => {
      if (req.is_confidential_to_pastors && !isPastorOrAdmin) return false;
      if (filterTab === 'testimonies') return req.status === 'answered_testimony';
      if (filterTab === 'pastoral') return req.is_confidential_to_pastors || req.status === 'under_pastoral_care';
      if (categoryFilter !== 'All') return req.category === categoryFilter;
      return true;
    })
    .sort((a, b) => {
      if (a.is_urgent && !b.is_urgent) return -1;
      if (!a.is_urgent && b.is_urgent) return 1;
      return b.created_at.localeCompare(a.created_at);
    });

  const totalPrayersOffered = prayerRequests.reduce((sum, req) => sum + req.prayed_count, 0);
  const totalTestimonies = prayerRequests.filter(r => r.status === 'answered_testimony').length;
  const urgentCount = prayerRequests.filter(r => r.is_urgent && r.status === 'active').length;

  return (
    <div className="space-y-6 pb-8">
      {/* High-Contrast Welcome & Scripture Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-200 bg-indigo-50/80 shadow-md space-y-3 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                Intercession & Praise
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-600 font-semibold">Fountain Gate Chapel</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Community Prayer Wall & Testimonies
            </h1>
            <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 shadow-xs mt-2">
              <p className="text-xs sm:text-sm font-semibold text-slate-800 italic leading-relaxed">
                "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."
              </p>
              <p className="text-[11px] font-extrabold text-indigo-700 text-right uppercase tracking-wider mt-0.5">
                — Philippians 4:6
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition self-start lg:self-auto shrink-0"
          >
            + Submit Prayer Request
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-slate-500 font-bold uppercase text-[10px]">Active Requests</p>
          <p className="font-display font-extrabold text-2xl text-indigo-600">
            {prayerRequests.filter(r => r.status === 'active').length}
          </p>
        </div>

        {urgentCount > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm space-y-1">
            <p className="text-rose-600 font-bold uppercase text-[10px]">🔴 Urgent Needs</p>
            <p className="font-display font-extrabold text-2xl text-rose-600 animate-pulse">{urgentCount}</p>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-slate-500 font-bold uppercase text-[10px]">Praise Testimonies</p>
          <p className="font-display font-extrabold text-2xl text-emerald-600">{totalTestimonies}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-slate-500 font-bold uppercase text-[10px]">Total Intercessions</p>
          <p className="font-display font-extrabold text-2xl text-amber-600">{totalPrayersOffered} 🙏</p>
        </div>
      </div>

      {/* Status Tab Controls */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300 max-w-md">
        <button
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
            filterTab === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({prayerRequests.filter(r => !r.is_confidential_to_pastors || isPastorOrAdmin).length})
        </button>

        <button
          onClick={() => setFilterTab('testimonies')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
            filterTab === 'testimonies' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Testimonies ({totalTestimonies})
        </button>

        {isPastorOrAdmin && (
          <button
            onClick={() => setFilterTab('pastoral')}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition relative ${
              filterTab === 'pastoral' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pastoral Queue
            {pastoralQueueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {pastoralQueueCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Category Filter Pills (visible on All tab) */}
      {filterTab === 'all' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Filter:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition border text-xs ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Prayer Feed */}
      <div className="space-y-4">
        {visibleRequests.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold text-xl">
              🙏
            </div>
            <h3 className="font-display font-bold text-slate-900 text-base">No Prayer Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first to share a prayer request or praise testimony with the church family.
            </p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm"
            >
              Submit Prayer Request
            </button>
          </div>
        ) : (
          visibleRequests.map(request => (
            <PrayerCard key={request.id} request={request} />
          ))
        )}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <SubmitPrayerModal onClose={() => setShowSubmitModal(false)} />
      )}
    </div>
  );
}
