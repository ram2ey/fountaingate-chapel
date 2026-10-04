'use client';
import { useEffect, useState } from 'react';

type Service = { id: string; name: string; starts_at: string; present: number; expected: number; expected_present: number; excused: number };
type Data = { services: Service[]; summary: { members: number; at_risk: number }; average: number | null; risk: { id: string; first_name: string; last_name: string; consecutive_absences: number }[] };
export function AttendanceOverview({ view = 'all' }: { view?: 'all' | 'metrics' | 'chart' | 'risk' }) {
  const [data, setData] = useState<Data | null>(null), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/attendance?view=analytics', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error('Attendance analytics unavailable.');
      setData(await response.json());
    }).catch(error => { if (error.name !== 'AbortError') setError('Attendance analytics unavailable. Refresh to retry.'); });
    return () => controller.abort();
  }, []);
  if (error) return <section className="ui-card p-5"><p role="alert" className="text-sm">{error}</p></section>;
  if (!data) return <section className="ui-card p-5"><p role="status" className="text-sm text-slate-500">Loading attendance…</p></section>;
  return <section className="ui-card p-5 space-y-6">
    {(view === 'all' || view === 'metrics') && <div>
      <h2 className="section-heading mb-4">Attendance overview</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"><p className="text-xs text-slate-500">Active members</p><p className="mt-2 text-3xl font-medium tabular-nums">{data.summary.members}</p></div>
        <div className="rounded-lg border border-church-200 bg-church-50 p-4"><p className="text-xs text-church-800">Members at risk</p><p className="mt-2 text-3xl font-medium tabular-nums text-church-900">{data.summary.at_risk}</p></div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"><p className="text-xs text-slate-500">Average attendance</p><p className="mt-2 text-3xl font-medium tabular-nums">{data.average === null ? '—' : data.average.toFixed(1)}</p><p className="mt-1 text-xs text-slate-500">{data.average === null ? 'Four completed services are needed.' : 'Latest four completed services'}</p></div>
      </div>
    </div>}
    {(view === 'all' || view === 'chart') && <div><h2 className="section-heading mb-3">Completed service attendance</h2>{!data.services.length ? <p className="text-sm text-slate-500">No completed services yet.</p> : <div role="region" aria-label="Completed service attendance table" tabIndex={0} className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[40rem] text-left"><thead><tr><th>Service</th><th>Date</th><th>Present</th><th>Expected</th><th>Excused</th><th>Expected attendance</th></tr></thead><tbody>{data.services.map(service => <tr key={service.id}><td>{service.name}</td><td className="whitespace-nowrap">{new Date(service.starts_at).toLocaleDateString()}</td><td>{service.present}</td><td>{service.expected}</td><td>{service.excused}</td><td>{service.expected - service.excused > 0 ? `${(service.expected_present / (service.expected - service.excused) * 100).toFixed(1)}%` : 'No eligible denominator'}</td></tr>)}</tbody></table></div>}</div>}
    {(view === 'all' || view === 'risk') && <div className="border-t border-slate-200 pt-5"><h2 className="section-heading">Pastoral care queue</h2><p className="mt-2 text-sm text-slate-500">Three or more consecutive eligible misses; excused services break the streak.</p>{!data.risk.length ? <p className="mt-3 text-sm">No members currently flagged by completed service history.</p> : data.risk.map(member => <p key={member.id} className="mt-3 text-sm">{member.first_name} {member.last_name}: {member.consecutive_absences} eligible services missed</p>)}</div>}
  </section>;
}
