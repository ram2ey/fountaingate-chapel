'use client';
import {useState} from 'react';
type Sermon={id:string;title:string;preacher:string;preached_on:string};
export function AudioLibraryPlayer({sermon}:{sermon:Sermon}){
 const [position,setPosition]=useState(0),[duration,setDuration]=useState<number|null>(null),[error,setError]=useState('');
 function clock(value:number){return Math.floor(value/60)+':'+String(Math.floor(value%60)).padStart(2,'0');}
 return <section className="space-y-3 rounded-xl border p-4 bg-white"><h2 className="font-semibold">{sermon.title}</h2><p className="text-sm text-slate-600">{sermon.preacher} · {sermon.preached_on.slice(0,10)}</p><audio key={sermon.id} controls preload="none" src={'/api/media/'+sermon.id} aria-label={'Sermon: '+sermon.title} onLoadedMetadata={e=>{const n=e.currentTarget.duration;setDuration(Number.isFinite(n)?n:null);setError('');}} onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)} onError={()=>setError('Audio unavailable or unsupported by this browser. Try downloading the original file.')} className="w-full"/><p className="text-sm">{clock(position)} / {duration===null?'Duration unavailable':clock(duration)}</p><p role="alert" className="text-sm text-red-700">{error}</p><a href={'/api/media/'+sermon.id} download className="text-church-700 underline">Download original audio</a></section>;
}
