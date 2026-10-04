'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, BookOpen, Heart, HandHeart, Radio, Settings } from 'lucide-react';
import { MemberAttendance } from '../attendance/MemberAttendance';
import { PrayerHighlights } from '../core/PrayerHighlights';
import { useChurch } from '../../lib/context/ChurchContext';
import { permittedNavigation } from '../layout/navigation';

const actions = [
  { href: '/giving', label: 'Online Giving', description: 'Tithes, offerings & seeds', icon: Heart },
  { href: '/prayer-wall', label: 'Prayer Wall', description: 'Pray with your church family', icon: HandHeart },
  { href: '/sermons', label: 'Sermon Hub', description: 'Messages to encourage your faith', icon: Radio },
  { href: '/settings', label: 'My Account', description: 'Your profile & preferences', icon: Settings },
];

export function MemberDashboard() {
  const { currentUser, currentRole, mediaSettings } = useChurch();
  const liveAvailable = !!mediaSettings?.live && !!mediaSettings.live_url;
  const allowed = permittedNavigation(currentRole);

  return <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">Welcome, {currentUser?.full_name || 'Beloved Member'}</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome to Fountain Gate Chapel, Change Pastures.</p>
    </div>

    <section aria-labelledby="worship-heading" className="relative isolate overflow-hidden rounded-xl bg-slate-900 text-white">
      <Image src="/images/worship-sunset.jpg" alt="" fill sizes="(max-width: 767px) 100vw, (max-width: 1440px) 75vw, 1152px" loading="eager" className="object-cover object-[center_40%]" />
      <div className="worship-overlay absolute inset-0" />
      <div className="relative flex min-h-72 flex-col items-start justify-center p-6 sm:min-h-80 sm:p-8 lg:p-10">
        {liveAvailable ? <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider"><span className="h-2 w-2 rounded-full bg-red-400 animate-live-pulse" />Live now</p> : <p className="mb-4 text-xs font-medium uppercase tracking-wider">Gather. Worship. Grow.</p>}
        <h2 id="worship-heading" className="max-w-md text-3xl font-medium leading-tight sm:text-4xl">{liveAvailable ? 'Join us in worship' : 'A place to grow in faith'}</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed">{liveAvailable ? 'Worship with your church family and share in the teaching of God’s word.' : 'Find encouragement, revisit a message, and stay connected to the life of our church.'}</p>
        <Link href="/sermons" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-church-100">{liveAvailable ? 'Watch Live' : 'Explore Sermons'}<ArrowUpRight aria-hidden="true" size={17} /></Link>
      </div>
    </section>

    <div className="grid gap-5 lg:grid-cols-3">
      <section aria-labelledby="quick-heading" className="ui-card p-5 lg:col-span-2">
        <h2 id="quick-heading" className="section-heading mb-4">Quick access</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {actions.filter(action => allowed.some(item => item.href === action.href)).map(action => {
            const Icon = action.icon;
            return <Link key={action.href} href={action.href} className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-church-300 hover:bg-church-50"><Icon aria-hidden="true" size={23} strokeWidth={1.5} className="mb-1 text-church-700" /><span className="text-sm font-medium">{action.label}</span><span className="text-xs leading-relaxed text-slate-500">{action.description}</span></Link>;
          })}
        </div>
      </section>
      <section aria-labelledby="scripture-heading" className="relative overflow-hidden rounded-xl border border-church-200 bg-gradient-to-br from-church-50 to-church-100 p-5">
        <div className="flex items-center justify-between gap-3"><h2 id="scripture-heading" className="section-heading">Scripture for reflection</h2><BookOpen aria-hidden="true" size={20} strokeWidth={1.5} className="shrink-0 text-church-700" /></div>
        <blockquote className="mt-5 text-sm leading-relaxed text-slate-700">“The LORD bless you and keep you; the LORD make His face shine upon you and be gracious to you; the LORD turn His face toward you and give you peace.”</blockquote>
        <p className="mt-4 text-xs font-medium text-church-800">Numbers 6:24–26</p>
      </section>
    </div>
    <div className="grid items-start gap-5 xl:grid-cols-2"><MemberAttendance /><PrayerHighlights /></div>
  </div>;
}
