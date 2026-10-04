'use client';
import { useState } from 'react';
export function IdentityManagement(){
 const [message,setMessage]=useState(''),[pending,setPending]=useState(false);
 async function submit(event:React.FormEvent<HTMLFormElement>,action:'invite'|'revoke'){
  event.preventDefault();setPending(true);setMessage('');
  try{const response=await fetch(`/api/staff/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))});const result=await response.json();if(!response.ok)throw Error(result.error);setMessage(action==='invite'?'Invitation accepted by the SMS provider. The recipient can accept the invitation using their existing password.':'Staff access revoked.');}
  catch(error){setMessage(error instanceof Error?error.message:'Request failed.');}finally{setPending(false);}}
 return <section className="space-y-5 p-5 rounded-xl bg-white"><h2 className="font-semibold">Staff access</h2>
  <p>Invite an existing verified account in your branch. Staff accept their invitation and sign in with their existing phone number and password.</p>
  <form onSubmit={e=>submit(e,'invite')} className="space-y-3"><label className="block">Phone<input required name="phone" type="tel" placeholder="+233..." className="block border p-2"/></label><label className="block">Role<select name="role" className="block border p-2"><option value="pastor">Pastor</option><option value="admin">Administrator</option></select></label><button disabled={pending} className="bg-church-700 text-white p-2 rounded">Invite staff</button></form>
  <form onSubmit={e=>submit(e,'revoke')} className="space-y-3"><label className="block">Account ID<input required name="user_id" className="block border p-2"/></label><button disabled={pending} className="border border-red-700 text-red-700 p-2 rounded">Revoke staff access</button></form><p role="status">{message}</p>
 </section>;
}
