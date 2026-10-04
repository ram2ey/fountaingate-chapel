'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Mode='login'|'register'|'recovery'|'resend'|'verify'|'reset'|'invite-enroll'|'invite-accept';
export function LoginForm() {
 const router=useRouter();
 const [mode,setMode]=useState<Mode>('login'),[message,setMessage]=useState(''),[pending,setPending]=useState(false);
 const [token,setToken]=useState(''),[secret,setSecret]=useState('');
 useEffect(()=>{
  const values=new URLSearchParams(window.location.hash.slice(1));
  for(const [key,next] of [['verify','verify'],['reset','reset'],['invite','invite-enroll']] as const) {
   const value=values.get(key);if(value){queueMicrotask(()=>{setToken(value);setMode(next);});break;}
  }
  if(window.location.hash)window.history.replaceState(null,'',window.location.pathname);
 },[]);
 async function submit(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();setPending(true);setMessage('');
  const data=Object.fromEntries(new FormData(event.currentTarget));
  try {
   const response=await fetch(`/api/auth/${mode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,token})});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Request unavailable.');
   if(mode==='login'){router.push('/');router.refresh();return;}
   if(mode==='invite-enroll'){setSecret(result.secret);setMode('invite-accept');setMessage('Add this secret to your authenticator, then enter its code.');}
   else {setMessage(result.message||'Completed. You can now sign in.');if(['verify','reset','invite-accept'].includes(mode)){setMode('login');setToken('');setSecret('');}}
  }catch(error){setMessage(error instanceof Error?error.message:'Request unavailable.');}finally{setPending(false);}
 }
 const credentials=['login','register','recovery','resend'].includes(mode);
 return <section className="max-w-lg mx-auto p-6 space-y-5 bg-white rounded-2xl border mt-12">
  <div><h1 className="text-2xl font-semibold">Fountain Gate account</h1><p className="mt-2 text-sm text-slate-500">Stay connected with your church family.</p></div>
  <div className="flex flex-wrap gap-1 rounded-lg bg-slate-50 p-1">{(['login','register','recovery','resend'] as const).map(value=><button key={value} type="button" aria-pressed={mode===value} disabled={pending} className={`rounded-lg px-3 py-2 text-sm capitalize ${mode===value?'bg-white text-church-800 shadow-sm':'text-slate-600 hover:bg-church-100'}`} onClick={()=>{setMode(value);setMessage('');}}>{value==='resend'?'Resend verification':value}</button>)}</div>
  <form onSubmit={submit} className="space-y-4">
   <p className="text-sm font-medium capitalize text-slate-600">{mode.replaceAll('-',' ')}</p>
   {credentials&&<label className="block">Phone (international format)<input required name="phone" autoComplete="tel" type="tel" maxLength={32} placeholder="+233..." className="block w-full border rounded p-2"/></label>}
   {['login','register'].includes(mode)&&<label className="block">Branch ID<input required name="branch_id" className="block w-full border rounded p-2"/></label>}
   {mode==='register'&&<label className="block">Full name<input required name="full_name" maxLength={160} autoComplete="name" className="block w-full border rounded p-2"/></label>}
   {!['recovery','resend'].includes(mode)&&<label className="block">{mode==='verify'?'Set your password to finish verification':'Password'}<input required name="password" type="password" minLength={['register','reset','verify'].includes(mode)?15:undefined} maxLength={128} autoComplete={['register','reset','verify'].includes(mode)?'new-password':'current-password'} className="block w-full border rounded p-2"/></label>}
   {['verify','reset','invite-enroll','invite-accept'].includes(mode)&&<label className="block">Link token<input required value={token} onChange={e=>setToken(e.target.value)} maxLength={43} className="block w-full border rounded p-2"/></label>}
   {secret&&<p className="break-all">Authenticator secret: <code>{secret}</code></p>}
   {['login','invite-accept'].includes(mode)&&<label className="block">Authenticator code (required for staff)<input name="totp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="block w-full border rounded p-2"/></label>}
   <button disabled={pending} className="btn-primary w-full">{pending?'Working…':'Continue'}</button>
  </form><p role="status" aria-live="polite">{message}</p>
 </section>;
}
