'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Brand } from './Brand';

// Routes that render standalone without Sidebar or Header nav bar
const STANDALONE_ROUTES = ['/login', '/kiosk', '/guest-intake'];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isStandalone = STANDALONE_ROUTES.includes(pathname);

  if (pathname === '/login') {
    return <><a className="skip-link" href="#main-content">Skip to main content</a><main id="main-content" tabIndex={-1} className="flex min-h-[100dvh] items-center bg-[var(--surface-page)] px-4 py-8 sm:px-8 sm:py-12">{children}</main></>;
  }

  if (isStandalone) {
    return <><a className="skip-link" href="#main-content">Skip to main content</a><main id="main-content" tabIndex={-1} className="standalone-content min-h-screen w-full bg-slate-50 px-4 py-8 sm:py-12"><div className="mx-auto flex max-w-2xl justify-center"><Brand /></div>{children}</main></>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header />
        <main id="main-content" tabIndex={-1} className="app-content flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
