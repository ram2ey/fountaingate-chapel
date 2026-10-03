'use client';
import Link from 'next/link';
import { PrayerHighlights } from '../components/core/PrayerHighlights';
import { AttendanceOverview } from '../components/attendance/AttendanceOverview';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';
import { FinancialBreakdownChart } from '../components/dashboard/FinancialBreakdownChart';
import { useChurch } from '../lib/context/ChurchContext';
export default function DashboardPage(){const {currentRole}=useChurch();if(currentRole==='member')return <MemberDashboard/>;return <div className="space-y-5"><h1 className="text-2xl font-bold">Church dashboard</h1><div className="flex gap-5"><Link href="/attendance" className="underline">Manage services and attendance</Link><Link href="/members" className="underline">Manage members</Link></div><AttendanceOverview/><PrayerHighlights/>{currentRole==='admin'&&<FinancialBreakdownChart/>}</div>;}
