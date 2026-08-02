'use client';

import React, { useState } from 'react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Member } from '../../lib/types/church';

interface Props {
  onCheckInSuccess: (member: Member) => void;
}

export const SelfServeCheckIn: React.FC<Props> = ({ onCheckInSuccess }) => {
  const { members, recordAttendance, t } = useChurch();

  const [inputMode, setInputMode] = useState<'phone' | 'name'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nameSearch, setNameSearch] = useState('');

  const matchingMembers = members.filter((member) => {
    if (inputMode === 'phone' && phoneNumber.length >= 3) {
      return member.phone.includes(phoneNumber);
    }
    if (inputMode === 'name' && nameSearch.length >= 2) {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      return fullName.includes(nameSearch.toLowerCase());
    }
    return false;
  });

  const handleConfirmCheckIn = (member: Member) => {
    recordAttendance([member.id], 'Sunday Service');
    onCheckInSuccess(member);
    setPhoneNumber('');
    setNameSearch('');
  };

  const handleKeypadPress = (digit: string) => {
    if (phoneNumber.length < 12) {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Mode Switcher */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300">
        <button
          onClick={() => setInputMode('phone')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
            inputMode === 'phone'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.phoneTab}
        </button>
        <button
          onClick={() => setInputMode('name')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
            inputMode === 'name'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.nameTab}
        </button>
      </div>

      {/* Input Display Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-lg text-center space-y-4 bg-white">
        {inputMode === 'phone' ? (
          <div>
            <div className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-4 text-3xl font-mono font-bold tracking-widest text-slate-900 min-h-[64px] flex items-center justify-center">
              {phoneNumber || <span className="text-slate-300 text-lg font-sans font-normal">{t.enterPhonePlaceholder}</span>}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4 max-w-sm mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num)}
                  className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-bold text-2xl transition shadow-sm border border-slate-200 flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPhoneNumber('')}
                className="h-14 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition border border-rose-200 flex items-center justify-center"
              >
                Clear
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-bold text-2xl transition shadow-sm border border-slate-200 flex items-center justify-center"
              >
                0
              </button>
              <button
                onClick={handleKeypadBackspace}
                className="h-14 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition border border-slate-300 flex items-center justify-center"
              >
                ⌫
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder={t.searchNamePlaceholder}
              className="w-full bg-slate-50 border-2 border-indigo-200 rounded-2xl p-4 text-lg text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white text-center"
            />
          </div>
        )}
      </div>

      {/* Matching Members Selection List */}
      {matchingMembers.length > 0 && (
        <div className="glass-panel p-5 rounded-3xl border border-indigo-200 bg-indigo-50/50 shadow-md space-y-3 animate-in fade-in">
          <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider text-center">
            {t.matchingFound}
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {matchingMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => handleConfirmCheckIn(member)}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 cursor-pointer transition shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-base flex items-center justify-center shrink-0">
                    {member.first_name[0]}
                  </div>
                  <div className="text-left">
                    <h5 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                      {member.first_name} {member.last_name}
                    </h5>
                    <p className="text-xs text-slate-500 font-medium">{member.cell_group} • {member.phone}</p>
                  </div>
                </div>

                <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md transition group-hover:bg-emerald-500">
                  {t.tapToCheckIn}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
