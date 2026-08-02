'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useChurch } from '../../lib/context/ChurchContext';

// Public routes accessible without logging in
const PUBLIC_ROUTES = ['/login', '/kiosk', '/guest-intake'];

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useChurch();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!currentUser && !isPublicRoute) {
      router.push('/login');
    }
  }, [currentUser, isPublicRoute, pathname, router]);

  // If unauthenticated and on a protected route, render loading redirect indicator
  if (!currentUser && !isPublicRoute) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg animate-pulse">
          FGC
        </div>
        <p className="text-xs font-bold text-slate-700">Redirecting to Sign In Screen...</p>
      </div>
    );
  }

  return <>{children}</>;
};
