'use client';
import Link from 'next/link';
import { ArrowUpRight, CalendarCheck, Users } from 'lucide-react';
import { PrayerHighlights } from '../components/core/PrayerHighlights';
import { AttendanceOverview } from '../components/attendance/AttendanceOverview';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';
import dynamic from 'next/dynamic';
import { useChurch } from '../lib/context/ChurchContext';
const FinancialBreakdownChart = dynamic(() => import('../components/dashboard/FinancialBreakdownChart').then(module => module.FinancialBreakdownChart));

export default function DashboardPage() {
  const { currentRole, currentUser } = useChurch();
  if (currentRole === 'member') return <MemberDashboard />;
  return <div className="space-y-6">
    <div><p className="mb-1 text-sm text-slate-500">Welcome, {currentUser?.full_name || 'Fountain Gate leader'}</p><h1 className="text-2xl font-semibold sm:text-3xl">Church dashboard</h1><p className="mt-2 text-sm text-slate-500">Care for your community and keep church life running smoothly.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      {[{ href: '/attendance', label: 'Manage services and attendance', icon: CalendarCheck }, { href: '/members', label: 'Manage members', icon: Users }].map(action => { const Icon = action.icon; return <Link key={action.href} href={action.href} className="ui-card flex min-h-20 items-center gap-4 p-5 transition-colors hover:border-church-300"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-church-50 text-church-700"><Icon aria-hidden="true" size={21} strokeWidth={1.6} /></span><span className="flex-1 text-sm font-medium">{action.label}</span><ArrowUpRight aria-hidden="true" size={18} className="text-slate-500" /></Link>; })}
    </div>
    <AttendanceOverview />
    <div className={`grid items-start gap-5 ${currentRole === 'admin' ? 'xl:grid-cols-2' : ''}`}><PrayerHighlights />{currentRole === 'admin' && <FinancialBreakdownChart />}</div>
  </div>;
}
