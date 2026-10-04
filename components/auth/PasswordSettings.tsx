'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export function PasswordSettings(){
 const router=useRouter();
 const [message,setMessage]=useState(''),[pending,setPending]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setPending(true);setMessage('');
  try{const response=await fetch('/api/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))});const result=await response.json();if(!response.ok)throw Error(result.error);router.push('/login');router.refresh();}
  catch(error){setMessage(error instanceof Error?error.message:'Password change failed.');}finally{setPending(false);}}
 return <form onSubmit={submit} className="p-5 bg-white rounded-xl space-y-3"><h2 className="font-semibold">Change password</h2><p>Changing your password signs out every session.</p>
  <label className="block">Current password<input required type="password" name="current_password" autoComplete="current-password" maxLength={128} className="block border p-2"/></label>
  <label className="block">New password<input required type="password" name="password" autoComplete="new-password" minLength={15} maxLength={128} className="block border p-2"/></label>
  <button disabled={pending} className="bg-church-700 text-white p-2 rounded">{pending?'Changing…':'Change password'}</button><p role="status">{message}</p></form>;
}
