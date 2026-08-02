'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChurch } from '../../lib/context/ChurchContext';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { currentRole, members } = useChurch();

  const atRiskCount = members.filter(m => m.status === 'at_risk').length;

  const NAV_ITEMS = [
    { label: 'Overview', href: '/', roles: ['admin', 'pastor'] },
    { label: 'Members', href: '/members', roles: ['admin', 'pastor'] },
    { label: 'Care', href: '/pastoral-care', badge: atRiskCount > 0 ? atRiskCount : undefined, roles: ['admin', 'pastor'] },
    { label: 'Sermons', href: '/sermons', roles: ['admin', 'pastor', 'member'] },
    { label: 'Giving', href: '/financials', roles: ['admin'] },
    { label: 'Kiosk', href: '/kiosk', roles: ['admin', 'pastor'] },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-2">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isAllowed = item.roles.includes(currentRole);
          const isActive = pathname === item.href;

          if (!isAllowed) return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition text-[11px] font-semibold relative ${
                isActive
                  ? 'text-indigo-600 bg-indigo-50 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
