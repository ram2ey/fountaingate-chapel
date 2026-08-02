'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Member } from '../../lib/types/church';

interface Props {
  onCheckInSuccess: (member: Member) => void;
}

export const SelfServeCheckIn: React.FC<Props> = ({ onCheckInSuccess }) => {
  const { members, recordAttendance } = useChurch();
  const [phoneInput, setPhoneInput] = useState('');
  const [matchedMembers, setMatchedMembers] = useState<Member[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<'Sunday Service' | 'Mid-week Cell' | 'Night Vigil'>('Sunday Service');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) return;

    const cleanInput = phoneInput.replace(/[^0-9]/g, '');
    const found = members.filter(m => m.phone.replace(/[^0-9]/g, '').includes(cleanInput));

    setMatchedMembers(found);
    setHasSearched(true);
  };

  const handleConfirmCheckIn = (member: Member) => {
    recordAttendance([member.id], selectedEventType);
    onCheckInSuccess(member);
    setPhoneInput('');
    setMatchedMembers([]);
    setHasSearched(false);
  };

  const appendDigit = (digit: string) => {
    setPhoneInput(prev => prev + digit);
  };

  const clearInput = () => {
    setPhoneInput('');
    setMatchedMembers([]);
    setHasSearched(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Service Selector */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300">
        {(['Sunday Service', 'Mid-week Cell', 'Night Vigil'] as const).map(type => (
          <button
            key={type}
            onClick={() => setSelectedEventType(type)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition ${
              selectedEventType === type
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Phone Number Display Box */}
      <form onSubmit={handleSearch} className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-lg bg-white space-y-4">
        <div className="relative">
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="Enter Phone Number..."
            className="w-full text-center font-mono font-bold text-2xl sm:text-3xl tracking-widest text-slate-900 bg-slate-100 border-2 border-slate-300 rounded-2xl p-4 focus:outline-none focus:border-indigo-600 focus:bg-white transition shadow-inner placeholder:text-slate-400 placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
          />
          {phoneInput && (
            <button
              type="button"
              onClick={clearInput}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => appendDigit(num)}
              className="py-3.5 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 text-slate-900 font-bold text-xl shadow-xs transition"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={clearInput}
            className="py-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => appendDigit('0')}
            className="py-3.5 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-indigo-50 text-slate-900 font-bold text-xl"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setPhoneInput(prev => prev.slice(0, -1))}
            className="py-3.5 rounded-2xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300"
          >
            ⌫ Back
          </button>
        </div>

        <button
          type="submit"
          disabled={!phoneInput}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-base shadow-md transition"
        >
          Check In
        </button>
      </form>

      {/* Search Results */}
      {hasSearched && (
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-md animate-in fade-in">
          <h4 className="font-display font-bold text-sm text-slate-900">
            {matchedMembers.length > 0 ? `Select Family Member (${matchedMembers.length})` : 'No Member Account Found'}
          </h4>

          {matchedMembers.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center space-y-2">
              <p>No registered member account matched <span className="font-bold">{phoneInput}</span>.</p>
              <p className="text-[11px] text-slate-500">Please see an usher or usherette to register on the Welcome Connect Card.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matchedMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-400 transition"
                >
                  <div>
                    <h5 className="font-bold text-slate-900 text-base">{member.first_name} {member.last_name}</h5>
                    <p className="text-xs text-slate-500">{member.cell_group} • {member.status}</p>
                  </div>

                  <button
                    onClick={() => handleConfirmCheckIn(member)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
                  >
                    Confirm Check-In
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
