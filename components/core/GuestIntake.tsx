'use client';
import { useRef, useState } from 'react';
export function GuestIntake(){
 const key=useRef<string|null>(null),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;key.current ||= crypto.randomUUID();setPending(true);setMessage('');
  const data:Record<string,unknown>=Object.fromEntries(new FormData(form));data.key=key.current;data.consent=data.consent==='on';
  try{const response=await fetch('/api/guest-intake',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error);setMessage('Your intake was saved. Thank you.');form.reset();key.current=null;}
  catch(error){setMessage(error instanceof Error?error.message:'Submission failed. Your entries are retained; retry with the same details.');}finally{setPending(false);}}
 return <section className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl border space-y-4"><h1 className="text-2xl font-semibold">First-time guest intake</h1><p>Your optional prayer is confidential to the pastoral team. Entering a phone does not create or verify an account.</p>
  <form onSubmit={submit} className="space-y-3">{['branch_id','first_name','last_name','phone'].map(name=><label key={name} className="block capitalize">{name.replaceAll('_',' ')}<input required={name!=='last_name'} name={name} maxLength={80} placeholder={name==='phone'?'+country code':''} className="block w-full border p-2 rounded"/></label>)}
   <label className="block">Optional prayer<textarea name="prayer" maxLength={3000} className="block w-full border p-2 rounded"/></label><label className="block"><input type="checkbox" name="consent"/> I consent to follow-up contact</label><button disabled={pending} className="bg-church-700 text-white p-2 rounded">{pending?'Submitting…':'Submit'}</button>
  </form><p role="status">{message}</p>
 </section>;
}
