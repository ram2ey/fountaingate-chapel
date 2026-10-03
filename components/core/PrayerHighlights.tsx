'use client';
import { useEffect, useState } from 'react';
export function PrayerHighlights(){
 const [items,setItems]=useState<{id:string;title:string;visibility:string}[]>([]),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('/api/core/prayers?limit=3',{cache:'no-store',signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw Error('Prayer highlights unavailable.');setItems(data.items);}).catch(e=>{if(e.name!=='AbortError')setError('Prayer highlights unavailable.');});return()=>controller.abort();},[]);
 return <section className="p-5 bg-white border rounded-xl space-y-2"><h2 className="font-bold">Prayer highlights</h2>{error?<p>{error}</p>:items.map(item=><p key={item.id}>{item.title} ({item.visibility})</p>)}<a href="/prayer-wall" className="underline">Open prayer wall</a></section>;
}
