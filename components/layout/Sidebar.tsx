'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, UserRound } from 'lucide-react';
import { useChurch } from '../../lib/context/ChurchContext';
import { Brand } from './Brand';
import { isCurrentRoute, permittedNavigation } from './navigation';

export function Sidebar() {
  const pathname = usePathname();
  const { currentRole, members, currentUser } = useChurch();
  const atRiskCount = members.filter(member => member.status === 'at_risk').length;

  return <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:flex">
    <Link href="/" aria-label="Fountain Gate Chapel, Change Pastures home" className="shrink-0 px-5 py-7"><Brand /></Link>
    <nav aria-label="Primary" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-5">
      {permittedNavigation(currentRole).map(item => {
        const active = isCurrentRoute(pathname, item.href);
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-church-100 font-semibold text-church-900' : 'text-slate-600 hover:bg-church-50 hover:text-slate-900'}`}>
          <Icon aria-hidden="true" size={18} strokeWidth={1.6} className="shrink-0" />
          <span className="flex-1 leading-snug">{item.label}</span>
          {item.badge === 'care' && atRiskCount > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">{atRiskCount}</span>}
        </Link>;
      })}
    </nav>
    <Link href="/settings" className="mx-4 flex min-h-16 shrink-0 items-center gap-3 border-t border-slate-200 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-church-100 text-church-800"><UserRound aria-hidden="true" size={18} strokeWidth={1.6} /></span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{currentUser?.full_name || 'Not signed in'}</p><p className="text-xs capitalize text-slate-500">{currentRole} · View profile</p></div>
      <ChevronRight aria-hidden="true" size={16} className="text-slate-500" />
    </Link>
  </aside>;
}
