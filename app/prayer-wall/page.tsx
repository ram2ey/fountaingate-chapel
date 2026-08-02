'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { PrayerCard } from '../../components/prayer/PrayerCard';
import { SubmitPrayerModal } from '../../components/prayer/SubmitPrayerModal';

export default function PrayerWallPage() {
  const { prayerRequests, currentRole } = useChurch();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'testimonies' | 'pastoral'>('all');

  const isPastorOrAdmin = currentRole === 'admin' || currentRole === 'pastor';

  // Filter requests based on user role and selected tab
  const visibleRequests = prayerRequests.filter(req => {
    // Hide confidential-to-pastors requests from regular members
    if (req.is_confidential_to_pastors && !isPastorOrAdmin) {
      return false;
    }

    if (filterTab === 'testimonies') {
      return req.status === 'answered_testimony';
    }

    if (filterTab === 'pastoral') {
      return req.is_confidential_to_pastors || req.status === 'under_pastoral_care';
    }

    return true;
  });

  const totalPrayersOffered = prayerRequests.reduce((sum, req) => sum + req.prayed_count, 0);
  const totalTestimonies = prayerRequests.filter(r => r.status === 'answered_testimony').length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-bold">
                Intercession & Praise
              </span>
              <span className="text-xs text-indigo-200">|</span>
              <span className="text-xs text-indigo-200 font-medium">Fountain Gate Chapel</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Community Prayer Wall & Testimonies
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-2xl">
              Post prayer requests, stand in intercession with brothers and sisters, and celebrate praise testimonies of God’s faithfulness.
            </p>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition self-start lg:self-auto"
          >
            + Submit Prayer Request
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-slate-500 font-bold uppercase text-[10px]">Active Prayer Requests</p>
          <p className="font-display font-extrabold text-2xl text-indigo-600">
            {prayerRequests.filter(r => r.status === 'active').length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-slate-500 font-bold uppercase text-[10px]">Praise Testimonies</p>
          <p className="font-display font-extrabold text-2xl text-emerald-600">
            {totalTestimonies}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-slate-500 font-bold uppercase text-[10px]">Total Intercessions Offered</p>
          <p className="font-display font-extrabold text-2xl text-amber-600">
            {totalPrayersOffered} 🙏
          </p>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300 max-w-md">
        <button
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
            filterTab === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Requests ({visibleRequests.length})
        </button>

        <button
          onClick={() => setFilterTab('testimonies')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
            filterTab === 'testimonies' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Praise Testimonies ({totalTestimonies})
        </button>

        {isPastorOrAdmin && (
          <button
            onClick={() => setFilterTab('pastoral')}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
              filterTab === 'pastoral' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pastoral Queue
          </button>
        )}
      </div>

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
