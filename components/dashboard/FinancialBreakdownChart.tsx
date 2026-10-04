'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
export function FinancialBreakdownChart(){
 const [totals,setTotals]=useState<{currency:string;fund:string;net_minor:string}[]|null>(null),[error,setError]=useState('');
 useEffect(()=>{const abort=new AbortController();fetch('/api/finance?view=summary',{cache:'no-store',signal:abort.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);if(!abort.signal.aborted)setTotals(data.totals);}).catch(e=>{if(!abort.signal.aborted)setError(e.message);});return()=>abort.abort();},[]);
 return <section className="glass-panel p-5 border border-slate-200 space-y-3"><h2 className="font-semibold text-base text-slate-900">Annual net giving</h2>{error?<p role="alert">{error}</p>:totals?totals.length?totals.map(t=>{const n=BigInt(t.net_minor),a=n<BigInt(0)?-n:n;return <p key={t.currency+t.fund}>{t.fund} · {t.currency} {n<BigInt(0)?'-':''}{String(a/BigInt(100))}.{String(a%BigInt(100)).padStart(2,'0')}</p>;}):<p>No recorded giving this year.</p>:<p role="status">Loading giving totals…</p>}<Link href="/financials" className="text-church-700 underline">View ledger and reports</Link></section>;
}
