'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export function PrayerHighlights(){
 const [items,setItems]=useState<{id:string;title:string;visibility:string}[]|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('/api/core/prayers?limit=3',{cache:'no-store',signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw Error('Prayer highlights unavailable.');setItems(data.items);}).catch(e=>{if(e.name!=='AbortError')setError('Prayer highlights unavailable.');});return()=>controller.abort();},[]);
 return <section className="ui-card p-5 space-y-4"><h2 className="section-heading">Prayer highlights</h2><p className="text-sm text-slate-500">Stand in faith with your church family.</p>{error?<p role="alert" className="text-sm">{error}</p>:items===null?<p role="status" className="text-sm text-slate-500">Loading prayer highlights…</p>:!items.length?<p className="text-sm text-slate-500">No prayer highlights to show.</p>:items.map(item=><div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs capitalize text-slate-500">{item.visibility}</p></div>)}<Link href="/prayer-wall" className="inline-flex min-h-11 items-center text-sm font-medium text-church-700 hover:underline">Open prayer wall →</Link></section>;
}
