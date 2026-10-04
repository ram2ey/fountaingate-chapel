'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, MoreHorizontal, Radio, Settings } from 'lucide-react';
import { useChurch } from '../../lib/context/ChurchContext';
import { AccessibleDialog } from '../common/AccessibleDialog';
import { Brand } from './Brand';
import { isCurrentRoute, mobileNavigation, permittedNavigation } from './navigation';

export function Header() {
  const pathname = usePathname();
  const { isLive, mediaSettings, currentUser, logout, currentRole, members } = useChurch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signoutError, setSignoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const items = permittedNavigation(currentRole);
  const quickItems = mobileNavigation.filter(item => items.some(nav => nav.href === item.href));
  const moreActive = !quickItems.some(item => isCurrentRoute(pathname, item.href));
  const atRiskCount = members.filter(member => member.status === 'at_risk').length;
  const title = items.find(item => isCurrentRoute(pathname, item.href))?.label || 'Fountain Gate Chapel, Change Pastures';
  const availableLive = isLive && !!mediaSettings?.live_url;

  async function handleLogout() {
    setSigningOut(true); setSignoutError('');
    try { await logout(); setMobileMenuOpen(false); }
    catch { setSignoutError('Sign-out failed. Please retry.'); }
    finally { setSigningOut(false); }
  }

  const signout = <button onClick={handleLogout} disabled={signingOut} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-church-50 hover:text-slate-900 disabled:opacity-50"><LogOut aria-hidden="true" size={17} strokeWidth={1.6} />{signingOut ? 'Signing out…' : 'Log Out'}</button>;

  return <>
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
      {signoutError && <p role="alert" className="mb-2 text-sm text-red-700">{signoutError}</p>}
      <div className="flex min-h-11 items-center justify-between gap-3">
        <Link href="/" className="min-w-0 md:hidden"><Brand compact /></Link>
        <p className="hidden text-sm font-medium text-slate-600 md:block">{title}</p>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {availableLive && <Link href="/sermons" aria-label="Watch live service" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-rose-700"><Radio aria-hidden="true" size={16} /><span className="hidden sm:inline">Live</span></Link>}
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs capitalize text-slate-600">{currentRole}</span>
          <Link href="/settings" aria-label="User Account Settings" className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-church-100 md:flex"><Settings aria-hidden="true" size={19} strokeWidth={1.6} /></Link>
          <div className="hidden md:block">{currentUser ? signout : <Link href="/login" className="btn-primary">Log In</Link>}</div>
        </div>
      </div>
    </header>

    <nav aria-label="Mobile shortcuts" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-slate-50/95 px-2 pt-1 backdrop-blur-sm md:hidden">
      {quickItems.map(item => {
        const active = isCurrentRoute(pathname, item.href), Icon = item.icon;
        return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-xs ${active ? 'font-semibold text-church-800' : 'text-slate-600 hover:bg-church-100'}`}><Icon aria-hidden="true" size={20} strokeWidth={active ? 2 : 1.6} /><span>{item.label}</span></Link>;
      })}
      <button type="button" aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={mobileMenuOpen} onClick={event => { event.currentTarget.focus(); setMobileMenuOpen(true); }} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs ${moreActive || mobileMenuOpen ? 'font-semibold text-church-800' : 'text-slate-600'}`}><MoreHorizontal aria-hidden="true" size={21} /><span>More</span></button>
    </nav>

    {mobileMenuOpen && <AccessibleDialog title="Navigation" onClose={() => setMobileMenuOpen(false)}>
      <p className="mb-4 text-sm text-slate-500">{currentUser?.full_name || 'Fountain Gate Chapel, Change Pastures'} · <span className="capitalize">{currentRole}</span></p>
      <nav aria-label="Mobile primary" className="space-y-1">
        {items.map(item => {
          const active = isCurrentRoute(pathname, item.href), Icon = item.icon;
          return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? 'bg-church-100 font-semibold text-church-900' : 'text-slate-700 hover:bg-church-50'}`}><Icon aria-hidden="true" size={18} strokeWidth={1.6} /><span className="flex-1">{item.label}</span>{item.badge === 'care' && atRiskCount > 0 && <span className="rounded-full bg-rose-100 px-2 text-rose-800">{atRiskCount}</span>}</Link>;
        })}
      </nav>
      <div className="mt-4 border-t border-slate-200 pt-3">{signoutError && <p role="alert" className="text-sm text-red-700">{signoutError}</p>}{currentUser ? signout : <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn-primary">Log In</Link>}</div>
    </AccessibleDialog>}
  </>;
}
