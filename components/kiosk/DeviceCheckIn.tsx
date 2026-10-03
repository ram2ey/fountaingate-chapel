'use client';
import { useState } from 'react';
export function DeviceCheckIn(){
 const [device,setDevice]=useState(''),[message,setMessage]=useState(''),[pending,setPending]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setPending(true);setMessage('');const form=e.currentTarget;
  try{const response=await fetch('/api/kiosk/checkin',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${device}`},body:JSON.stringify({token:new FormData(form).get('token')})});const result=await response.json();if(!response.ok)throw Error(result.error);setMessage('Attendance recorded.');form.reset();}
  catch(error){setMessage(error instanceof Error?error.message:'Check-in unavailable.');}finally{setPending(false);}}
 return <section className="max-w-lg mx-auto mt-10 p-6 rounded-xl bg-white space-y-4"><h1 className="font-bold text-2xl">Attended check-in</h1><p>A registered device and a member’s five-minute service token are required. There is no anonymous member search.</p>
  <label className="block">Device credential<input type="password" value={device} onChange={e=>setDevice(e.target.value)} maxLength={43} autoComplete="off" className="block border p-2 w-full"/></label>
  <form onSubmit={submit} className="space-y-3"><label className="block">Member check-in token<input required name="token" maxLength={43} autoComplete="off" className="block border p-2 w-full"/></label><button disabled={pending||!device} className="bg-indigo-700 text-white rounded p-2">{pending?'Recording…':'Check in'}</button></form><p role="status">{message}</p>
 </section>;
}
