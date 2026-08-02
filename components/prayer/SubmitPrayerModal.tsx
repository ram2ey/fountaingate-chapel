'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { PrayerCategory } from '../../lib/types/church';

interface Props {
  onClose: () => void;
}

export const SubmitPrayerModal: React.FC<Props> = ({ onClose }) => {
  const { addPrayerRequest, currentUser } = useChurch();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('Healing & Health');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isConfidentialToPastors, setIsConfidentialToPastors] = useState(false);
  const [requesterName, setRequesterName] = useState(currentUser?.full_name || '');
  const [requesterPhone, setRequesterPhone] = useState(currentUser?.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !details) return;

    addPrayerRequest({
      requester_name: isAnonymous ? 'Anonymous Member' : (requesterName || 'Church Member'),
      requester_phone: requesterPhone || '+233244000111',
      title,
      details,
      category,
      is_anonymous: isAnonymous,
      is_confidential_to_pastors: isConfidentialToPastors
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Submit Prayer Request</h3>
            <p className="text-xs text-slate-500">Stand in faith with Fountain Gate Chapel intercessors</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Prayer Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Healing & Restoration for Family Member"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Prayer Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PrayerCategory)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
            >
              <option value="Healing & Health">Healing & Health</option>
              <option value="Financial Breakthrough">Financial Breakthrough</option>
              <option value="Family & Marriage">Family & Marriage</option>
              <option value="Salvation & Spiritual Growth">Salvation & Spiritual Growth</option>
              <option value="Career & Business">Career & Business</option>
              <option value="General Intercession">General Intercession</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Prayer Details & Specifics *</label>
            <textarea
              required
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Share details of what you are trusting God for..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Your Name</label>
              <input
                type="text"
                disabled={isAnonymous}
                value={isAnonymous ? 'Anonymous' : requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">WhatsApp / Phone</label>
              <input
                type="tel"
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
                placeholder="+233244000111"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
              />
            </div>
          </div>

          {/* Privacy Toggles */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 text-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-bold">Post Anonymously</p>
                <p className="text-[10px] text-slate-500">Hide your name on the public Prayer Wall</p>
              </div>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-indigo-100">
              <div>
                <p className="font-bold text-amber-900">Confidential to Pastors Only</p>
                <p className="text-[10px] text-slate-500">Hide from public wall; visible only to Pastoral Team</p>
              </div>
              <input
                type="checkbox"
                checked={isConfidentialToPastors}
                onChange={(e) => setIsConfidentialToPastors(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
            >
              Submit Prayer Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
