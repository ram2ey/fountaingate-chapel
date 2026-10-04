'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChurch } from '../../lib/context/ChurchContext';

type Resource='members'|'care'|'guests'|'prayers'|'profile'|'audit';
type Row=Record<string,string|number|boolean|null>;
const fields:Record<Resource,string[]>={members:['first_name','last_name','phone','email','dob','address','cell_group'],care:['member_id','body','follow_up_date'],guests:['id','stage','assigned_to'],prayers:['title','body'],profile:['full_name'],audit:[]};
export function CoreWorkspace({resource}:{resource:Resource}){
 const router=useRouter(),{currentUser,currentRole}=useChurch();
 const [items,setItems]=useState<Row[]>([]),[guestPrayers,setGuestPrayers]=useState<Row[]>([]),[birthdays,setBirthdays]=useState<Row[]>([]);
 const [search,setSearch]=useState(''),[applied,setApplied]=useState(''),[archived,setArchived]=useState(false),[cursor,setCursor]=useState<string|null>(null);
 const [loading,setLoading]=useState(true),[pending,setPending]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[edit,setEdit]=useState<Row|null>(null),[profile,setProfile]=useState<Row|null>(null),[thread,setThread]=useState<Row[]>([]);
 const requestSequence=useRef({value:0});
 const [guestCursor,setGuestCursor]=useState<string|null>(null),[birthdayCursor,setBirthdayCursor]=useState<string|null>(null);
 const load=useCallback(async(append=false,next:string|null=null)=>{
  const sequence=++requestSequence.current.value;
  try{
   const params=new URLSearchParams({search:applied,archived:String(archived)});if(next)params.set('cursor',next);
   const response=await fetch(`/api/core/${resource}?${params}`,{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error);
   if(sequence!==requestSequence.current.value)return;
   setError('');
   if(resource==='profile')setProfile({...data.profile,...data.preferences});else setItems(previous=>append?[...previous,...data.items]:data.items);
   if(!append){setGuestPrayers(data.guest_prayers||[]);setGuestCursor(data.next_guest_cursor||null);}setCursor(data.next_cursor||null);
   if(resource==='members'&&!append){const r=await fetch('/api/core/birthdays',{cache:'no-store'});const b=await r.json();if(r.ok&&sequence===requestSequence.current.value){setBirthdays(b.items);setBirthdayCursor(b.next_cursor||null);}}
  }catch(e){if(sequence===requestSequence.current.value)setError(e instanceof Error?e.message:'Load failed.');}finally{if(sequence===requestSequence.current.value)setLoading(false);}
 },[resource,applied,archived]);
 useEffect(()=>{const tracker=requestSequence.current;let active=true;queueMicrotask(()=>{if(active)void load();});return ()=>{active=false;tracker.value++;};},[load]);
 async function moreBirthdays(){if(!birthdayCursor)return;setLoading(true);const sequence=++requestSequence.current.value;try{const response=await fetch('/api/core/birthdays?cursor='+birthdayCursor,{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error);if(sequence===requestSequence.current.value){setBirthdays(previous=>[...previous,...data.items]);setBirthdayCursor(data.next_cursor||null);}}catch(e){if(sequence===requestSequence.current.value)setError(e instanceof Error?e.message:'Birthdays unavailable.');}finally{if(sequence===requestSequence.current.value)setLoading(false);}}
 async function save(body:Record<string,unknown>){
  setPending(true);setError('');setMessage('');try{
   const response=await fetch(`/api/core/${resource}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error);
   setMessage('Saved to the database.');setEdit(null);await load();if(resource==='profile')router.refresh();return true;
  }catch(e){setError(e instanceof Error?e.message:'Save failed.');return false;}finally{setPending(false);}
 }
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const form=e.currentTarget,body:Record<string,unknown>=Object.fromEntries(new FormData(form));
  if(edit&&resource==='members')body.id=edit.id;
  if(resource==='care')body.confidential=body.confidential==='on';
  if(resource==='profile'){body.sms=body.sms==='on';body.email=body.email==='on';}
  if(await save(body))form.reset();
 }
 async function showThread(id:string){try{const response=await fetch(`/api/core/prayers?thread=${id}`,{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error);setThread(data.thread||[]);}catch{setError('Thread unavailable.');}}
 const canModifyPrayer=(row:Row)=>row.author_id===currentUser?.id||currentRole==='pastor';
 async function moreGuestPrayers(){const sequence=++requestSequence.current.value;setLoading(true);try{const params=new URLSearchParams({view:'guest_prayers',cursor:guestCursor||'',search:applied});const response=await fetch('/api/core/care?'+params,{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error);if(sequence===requestSequence.current.value){setGuestPrayers(old=>[...old,...data.items]);setGuestCursor(data.next_cursor);}}catch(e){if(sequence===requestSequence.current.value)setError((e as Error).message);}finally{if(sequence===requestSequence.current.value)setLoading(false);}}
 return <section className="space-y-5 max-w-5xl mx-auto">
  <h1 className="text-2xl font-semibold capitalize">{resource==='profile'?'Profile and preferences':resource}</h1>
  {resource!=='profile'&&<form onSubmit={e=>{e.preventDefault();setLoading(true);if(search===applied)void load();else setApplied(search);}} className="flex gap-2"><label className="flex-1">Search<input value={search} onChange={e=>setSearch(e.target.value)} maxLength={100} className="block w-full border rounded p-2"/></label><button className="border p-2 rounded">Search</button></form>}
  {resource==='members'&&<label><input type="checkbox" checked={archived} onChange={e=>{setLoading(true);setArchived(e.target.checked);}}/> Show archived members</label>}
  {error&&<div role="alert" className="text-red-700"><p>{error}</p><button onClick={()=>{setLoading(true);void load();}} className="underline">Retry load</button><p>Your form entries are retained after a failed save.</p></div>}
  {loading&&<p role="status">Loading…</p>}
  <p role="status" className="text-green-800">{message}</p>
  {!loading&&!error&&!items.length&&resource!=='profile'&&<p>No matching records.</p>}
  {resource!=='audit'&&(resource!=='profile'||profile)&&<form key={resource==='profile'?JSON.stringify(profile):String(edit?.id||'new')} onSubmit={submit} className="p-5 rounded-xl bg-white border space-y-3">
   <h2 className="font-semibold">{edit?'Edit member':resource==='profile'?'Account details':resource==='guests'?'Advance guest follow-up':'Add record'}</h2>
   {fields[resource].map(name=><label key={name} className="block capitalize">{name.replaceAll('_',' ')}{name==='body'?<textarea name={name} required maxLength={3000} className="block w-full border rounded p-2"/>:<input name={name} defaultValue={String((resource==='profile'?profile:edit)?.[name]||'')} type={name==='dob'||name==='follow_up_date'?'date':name==='email'?'email':'text'} required={['first_name','phone','member_id','body','title','full_name','id','stage'].includes(name)} maxLength={name==='address'?500:254} className="block w-full border rounded p-2"/>}</label>)}
   {resource==='care'&&<label><input type="checkbox" name="confidential" defaultChecked/> Confidential (pastors only)</label>}
   {resource==='prayers'&&<label className="block">Visibility<select name="visibility" className="border rounded p-2"><option value="private">Private: you and pastors</option><option value="branch">Visible to verified branch members</option></select></label>}
   {resource==='profile'&&<div className="flex gap-4"><label><input type="checkbox" name="sms" defaultChecked={Boolean(profile?.sms)}/> SMS announcements and reminders (uncheck to unsubscribe)</label><label><input type="checkbox" name="email" defaultChecked={Boolean(profile?.email)}/> Email consent</label></div>}
   <button disabled={pending} className="bg-church-700 text-white p-2 rounded">{pending?'Saving…':'Save'}</button>{edit&&<button type="button" onClick={()=>setEdit(null)} className="ml-3 underline">Cancel editing</button>}
  </form>}
  {items.map(row=><article key={String(row.id)} className="p-4 border rounded-xl bg-white space-y-2">
   {Object.entries(row).filter(([key])=>!['reacted','reaction_count'].includes(key)).map(([key,value])=><p key={key} className="break-words text-sm"><strong>{key.replaceAll('_',' ')}: </strong>{String(value??'')}</p>)}
   {resource==='members'&&<div className="flex gap-3"><button disabled={pending} onClick={()=>void save({id:row.id,action:archived?'restore':'archive'})} className="underline">{archived?'Restore':'Archive'}</button>{!archived&&<button onClick={()=>setEdit(row)} className="underline">Edit</button>}</div>}
   {resource==='prayers'&&<div className="space-y-3">
    <div className="flex flex-wrap gap-3"><button disabled={pending} onClick={()=>void save({id:row.id,action:'react',reacted:!row.reacted})} className="underline">{row.reacted?'Remove prayer reaction':'Pray'} ({row.reaction_count})</button><button onClick={()=>void showThread(String(row.id))} className="underline">View discussion</button>
     {canModifyPrayer(row)&&<><button disabled={pending} onClick={()=>void save({id:row.id,action:'status',status:row.status==='answered'?'active':'answered'})} className="underline">{row.status==='answered'?'Reopen':'Mark answered'}</button><button disabled={pending} onClick={()=>void save({id:row.id,action:'archive'})} className="underline">Archive</button></>}
    </div><form onSubmit={async e=>{e.preventDefault();const f=e.currentTarget;if(await save({id:row.id,action:'comment',body:new FormData(f).get('body')}))f.reset();}} className="flex gap-2"><input aria-label="Prayer comment" required name="body" maxLength={3000} className="border p-2 flex-1"/><button disabled={pending} className="underline">Comment</button></form>
    {canModifyPrayer(row)&&<form onSubmit={async e=>{e.preventDefault();const f=e.currentTarget;if(await save({id:row.id,action:'update',body:new FormData(f).get('body')}))f.reset();}} className="flex gap-2"><input aria-label="Prayer update" required name="body" maxLength={3000} className="border p-2 flex-1"/><button disabled={pending} className="underline">Add update</button></form>}
   </div>}
  </article>)}
  {thread.length>0&&<section className="border p-4 rounded"><h2 className="font-semibold">Discussion</h2>{thread.map(row=><p key={String(row.id)}>{String(row.kind)}: {String(row.body)}</p>)}</section>}
  {guestPrayers.length>0&&<section className="border p-4 rounded"><h2 className="font-semibold">Confidential guest prayers</h2>{guestPrayers.map(row=><p key={String(row.id)}>{String(row.member_id)}: {String(row.body)}</p>)}</section>}
  {guestCursor&&<button disabled={loading} onClick={moreGuestPrayers} className="border p-2">Load more guest prayers</button>}
  {birthdays.length>0&&<section className="border p-4 rounded"><h2 className="font-semibold">Upcoming birthdays (Africa/Accra calendar; leap-day observed 28 February)</h2>{birthdays.map(row=><p key={String(row.id)}>{String(row.first_name)} {String(row.last_name)}: {String(row.next_birthday)}</p>)}</section>}
  {birthdayCursor&&<button disabled={loading} onClick={moreBirthdays} className="border p-2">Load more birthdays</button>}
  {cursor&&<button disabled={loading} onClick={()=>{setLoading(true);void load(true,cursor);}} className="border p-2 rounded">Load more</button>}
 </section>;
}
