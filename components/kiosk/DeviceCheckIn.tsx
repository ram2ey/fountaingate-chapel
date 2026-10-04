'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import { deviceScope,drainQueue,enqueue,listQueue,markRejected,removeQueued,type QueuedCheckIn } from '../../lib/kiosk/queue';
import { QRScanner } from './QRScanner';
export function DeviceCheckIn(){
 const [device,setDevice]=useState(''),[rows,setRows]=useState<QueuedCheckIn[]>([]),[message,setMessage]=useState(''),[pending,setPending]=useState(false);
 const draining=useRef(false);
 const [serviceInput,setServiceInput]=useState(''),[tokenInput,setTokenInput]=useState('');
 const refresh=useCallback(async()=>{if(!device)return setRows([]);setRows(await listQueue(await deviceScope(device)));},[device]);
 const sync=useCallback(async()=>{
  if(!device||draining.current)return;draining.current=true;setPending(true);
  try{const scope=await deviceScope(device);const run=()=>drainQueue(device,scope);
   const result=typeof navigator.locks!=='undefined'?await navigator.locks.request('fgc-kiosk-drain',run):await run();
   setMessage(result.revoked?'Device revoked or expired. Tokens cleared; staff resolution is required.':`${result.saved} entries acknowledged by the server.`);if(result.revoked)setDevice('');else await refresh();
  }catch(error){setMessage(error instanceof Error?error.message:'Server unreachable. Local entries are retained.');await refresh().catch(()=>{});}
  finally{draining.current=false;setPending(false);}
 },[device,refresh]);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)void refresh().catch(()=>setMessage('Local queue could not be read.'));});return()=>{active=false;};},[refresh]);
 useEffect(()=>{const reconnect=()=>void sync();window.addEventListener('online',reconnect);return()=>window.removeEventListener('online',reconnect);},[sync]);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,data=new FormData(form);setPending(true);setMessage('');
  try{await enqueue({operation_id:crypto.randomUUID(),device_scope:await deviceScope(device),service_id:String(data.get('service_id')),token:String(data.get('token')),recorded_at:new Date().toISOString()});
   form.reset();setServiceInput('');setTokenInput('');setMessage('Queued on this device. Attendance is saved only after server acknowledgement.');await refresh();
  }catch(error){setMessage(error instanceof Error?error.message:'Queue storage failed. No attendance is claimed.');}finally{setPending(false);}
  if(navigator.onLine)await sync();
 }
 return <section className="max-w-2xl mx-auto mt-10 p-6 rounded-xl bg-white space-y-4"><h1 className="font-semibold text-2xl">Attended check-in</h1><p>Use a registered device and a member’s five-minute service token. An already open kiosk tab can queue while disconnected; a first visit requires a connection. Keep the clock correct.</p>
  <label className="block">Device credential<input type="password" value={device} disabled={pending} onChange={e=>setDevice(e.target.value)} maxLength={43} autoComplete="off" className="block border p-2 w-full"/></label>
  <QRScanner onCapture={value=>{setServiceInput(value.service_id);setTokenInput(value.token);}}/><form onSubmit={submit} className="space-y-3"><label className="block">Service ID<input required name="service_id" value={serviceInput} onChange={e=>setServiceInput(e.target.value)} maxLength={36} pattern="[a-fA-F0-9-]{36}" className="block border p-2 w-full"/></label><label className="block">Member check-in token<input required name="token" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} pattern="[A-Za-z0-9_-]{43}" maxLength={43} autoComplete="off" className="block border p-2 w-full"/></label><button disabled={pending||device.length!==43} className="bg-church-700 text-white rounded p-2">{pending?'Processing…':'Capture check-in'}</button></form>
  <p role="status">{message}</p><p>{rows.length} entries stored for this device</p><button disabled={pending||!device} onClick={()=>void sync()} className="underline">Retry synchronization</button>
  {rows.map(row=><article key={row.operation_id} className="border p-3 space-y-2"><p>Service {row.service_id} · captured {row.recorded_at}</p><p>{row.error||'Queued locally; awaiting acknowledgement'}</p>{row.error&&<>{row.token&&<button disabled={pending} onClick={async()=>{await markRejected(row,'');await refresh();}} className="underline">Retry after staff review</button>}<button disabled={pending} onClick={async()=>{if(window.confirm('Discard this local entry? This does not record attendance. Confirm staff has resolved it first.')){await removeQueued(row.operation_id);await refresh();}}} className="underline ml-3">Discard resolved entry</button></>}</article>)}
 </section>;
}
