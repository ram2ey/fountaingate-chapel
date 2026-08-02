'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Member } from '../../lib/types/church';

interface Props {
  onCheckInSuccess: (member: Member) => void;
}

export const SelfServeCheckIn: React.FC<Props> = ({ onCheckInSuccess }) => {
  const { members, recordAttendance, isOnline, pendingOfflineCount, syncOfflineCheckIns, t } = useChurch();

  const [inputDigits, setInputDigits] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [mode, setMode] = useState<'phone' | 'name'>('phone');
  const [matchedMembers, setMatchedMembers] = useState<Member[]>([]);

  const handleKeyPress = (num: string) => {
    if (inputDigits.length < 12) {
      const updated = inputDigits + num;
      setInputDigits(updated);
      findMatchesByPhone(updated);
    }
  };

  const handleBackspace = () => {
    const updated = inputDigits.slice(0, -1);
    setInputDigits(updated);
    findMatchesByPhone(updated);
  };

  const handleClear = () => {
    setInputDigits('');
    setMatchedMembers([]);
  };

  const findMatchesByPhone = (digits: string) => {
    if (digits.length < 3) {
      setMatchedMembers([]);
      return;
    }
    const filtered = members.filter(m => m.phone.replace(/[^0-9]/g, '').includes(digits));
    setMatchedMembers(filtered);
  };

  const handleNameSearchChange = (val: string) => {
    setNameSearch(val);
    if (val.trim().length < 2) {
      setMatchedMembers([]);
      return;
    }
    const filtered = members.filter(m => 
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(val.toLowerCase())
    );
    setMatchedMembers(filtered);
  };

  const executeCheckIn = (member: Member) => {
    if (!isOnline) {
      try {
        const cached = localStorage.getItem('fgc_kiosk_offline_checkins');
        const list = cached ? JSON.parse(cached) : [];
        list.push({ memberIds: [member.id], eventType: 'Sunday Service', timestamp: new Date().toISOString() });
        localStorage.setItem('fgc_kiosk_offline_checkins', JSON.stringify(list));
      } catch (e) {}
    } else {
      recordAttendance([member.id], 'Sunday Service');
    }
    onCheckInSuccess(member);
    handleClear();
    setNameSearch('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Mode Toggle */}
      <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit mx-auto text-xs">
        <button
          onClick={() => { setMode('phone'); handleClear(); }}
          className={`px-5 py-2.5 rounded-xl font-bold transition ${
            mode === 'phone'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.phoneTab}
        </button>

        <button
          onClick={() => { setMode('name'); handleClear(); }}
          className={`px-5 py-2.5 rounded-xl font-bold transition ${
            mode === 'name'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.nameTab}
        </button>
      </div>

      {mode === 'phone' ? (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
          {/* Digits Display */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 text-center">
            <span className="text-3xl font-mono font-bold tracking-widest text-indigo-300 min-h-[40px] block">
              {inputDigits || t.enterPhonePlaceholder}
            </span>
          </div>

          {/* Numeric Touchpad */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-2xl font-bold text-slate-100 shadow-md transition active:scale-95 flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-rose-400 shadow-md transition active:scale-95 flex items-center justify-center uppercase"
            >
              Clear
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-2xl font-bold text-slate-100 shadow-md transition active:scale-95 flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-bold text-amber-400 shadow-md transition active:scale-95 flex items-center justify-center uppercase"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
          <div className="relative">
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => handleNameSearchChange(e.target.value)}
              placeholder={t.searchNamePlaceholder}
              className="w-full bg-slate-950 border border-indigo-500/40 rounded-2xl px-4 py-4 text-base text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Instant Matches Results */}
      {matchedMembers.length > 0 && (
        <div className="glass-panel p-5 rounded-3xl border border-indigo-500/40 space-y-3 animate-in fade-in shadow-2xl">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
            {t.matchingFound}
          </p>

          <div className="space-y-2">
            {matchedMembers.map(member => (
              <button
                key={member.id}
                onClick={() => executeCheckIn(member)}
                className="w-full p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/40 transition flex items-center justify-between text-left group"
              >
                <div>
                  <h4 className="font-bold text-base text-slate-100 group-hover:text-amber-300">
                    {member.first_name} {member.last_name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Phone: {member.phone} • Cell: {member.cell_group}
                  </p>
                </div>

                <span className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md group-hover:bg-indigo-500">
                  {t.tapToCheckIn}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
