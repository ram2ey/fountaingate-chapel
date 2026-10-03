'use client';
import { useEffect,useState } from 'react';
type Service={id:string;name:string;starts_at:string;present:number;expected:number;expected_present:number;excused:number};
type Data={services:Service[];summary:{members:number;at_risk:number};average:number|null;risk:{id:string;first_name:string;last_name:string;consecutive_absences:number}[]};
export function AttendanceOverview({view='all'}:{view?:'all'|'metrics'|'chart'|'risk'}){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('/api/attendance?view=analytics',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('Attendance analytics unavailable.');setData(await r.json());}).catch(e=>{if(e.name!=='AbortError')setError('Attendance analytics unavailable. Refresh to retry.');});return()=>controller.abort();},[]);
 if(error)return <p role="alert">{error}</p>;if(!data)return <p role="status">Loading attendance…</p>;
 return <section className="border bg-white p-5 rounded-xl space-y-4">
  {(view==='all'||view==='metrics')&&<><h2 className="font-bold">Attendance overview</h2><p>{data.summary.members} active members · {data.summary.at_risk} at risk</p><p>{data.average===null?'Four completed services are needed for an average.':`Average attendance across the latest four completed services: ${data.average.toFixed(1)}`}</p></>}
  {(view==='all'||view==='chart')&&<><h2 className="font-bold">Completed service attendance</h2>{!data.services.length?<p>No completed services yet.</p>:<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Service</th><th>Date</th><th>Present</th><th>Expected</th><th>Excused</th><th>Expected attendance</th></tr></thead><tbody>{data.services.map(s=><tr key={s.id}><td>{s.name}</td><td>{new Date(s.starts_at).toLocaleDateString()}</td><td>{s.present}</td><td>{s.expected}</td><td>{s.excused}</td><td>{s.expected-s.excused>0?`${(s.expected_present/(s.expected-s.excused)*100).toFixed(1)}%`:'No eligible denominator'}</td></tr>)}</tbody></table></div>}</>}
  {(view==='all'||view==='risk')&&<><h2 className="font-bold">Pastoral care queue</h2><p>Three or more consecutive eligible misses; excused services break the streak.</p>{!data.risk.length?<p>No members currently flagged by completed service history.</p>:data.risk.map(m=><p key={m.id}>{m.first_name} {m.last_name}: {m.consecutive_absences} eligible services missed</p>)}</>}
 </section>;
}
