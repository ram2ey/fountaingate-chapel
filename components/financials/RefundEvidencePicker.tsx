'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
export function RefundEvidencePicker(){
 const [items,setItems]=useState<{id:string;title:string}[]>([]),[error,setError]=useState('');
 useEffect(()=>{const abort=new AbortController();fetch('/api/finance/evidence',{cache:'no-store',signal:abort.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);if(!abort.signal.aborted)setItems(data.items);}).catch(e=>{if(!abort.signal.aborted)setError(e.message);});return()=>abort.abort();},[]);
 return <div><label>Uploaded refund evidence<select name="document_id" required className="block w-full border rounded-lg p-2"><option value="">Choose a document</option>{items.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></label><Link className="text-church-700 underline" href="/documents" target="_blank" rel="noopener noreferrer">Upload evidence in Documents</Link><p className="text-xs">Latest 100 documents you uploaded. Reopen this form after uploading.</p>{error&&<p role="alert">{error}</p>}</div>;
}
