'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChurch } from '../../lib/context/ChurchContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPhone } = useChurch();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setErrorMsg('Please enter both phone number and password.');
      return;
    }

    const success = loginWithPhone(phone, password);
    if (success) {
      router.push('/');
    } else {
      setErrorMsg('Invalid phone number or password. Please try again.');
    }
  };

  const fillDemoAccount = (demoPhone: string) => {
    setPhone(demoPhone);
    setPassword('password123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl mx-auto flex items-center justify-center shadow-lg">
            FGC
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900">
            Sign In to FGC CMS
          </h2>
          <p className="text-xs text-slate-500">
            Fountain Gate Chapel Management Ecosystem
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Phone / WhatsApp Number *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 24 400 0111 or 0244000111"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Account Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition"
          >
            Sign In with Phone Number
          </button>
        </form>

        {/* 1-Click Quick Fill Demo Accounts */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-2.5">
          <p className="font-bold text-amber-900 text-xs">⚡ Quick 1-Click Sign In Accounts:</p>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              onClick={() => fillDemoAccount('+233244000111')}
              className="p-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold shadow-xs text-center"
            >
              Admin
            </button>
            <button
              onClick={() => fillDemoAccount('+233501987654')}
              className="p-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold shadow-xs text-center"
            >
              Pastor
            </button>
            <button
              onClick={() => fillDemoAccount('+233277334455')}
              className="p-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold shadow-xs text-center"
            >
              Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
